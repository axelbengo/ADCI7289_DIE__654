import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

Deno.serve(async (req) => {
  try {
    const body = await req.json()
    
    if (body.event_type === "transaction.completed") {
      const data = body.data;
      const customData = data.custom_data;
      
      // 1. Infos de base
      const userId = customData?.user_id;
      const intentId = customData?.payment_intent_id;
      const currencyCode = data.currency_code || "USD";

      // 2. RÉCUPÉRATION DE LA QUANTITÉ (C'est ici que ça se joue)
      // Paddle envoie un tableau "items". On prend la quantité du premier item.
      const quantity = data.items?.[0]?.quantity || 1;

      const supabaseAdmin = createClient(
        Deno.env.get('SUPABASE_URL')!,
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
      )

      // 3. Récupérer la définition du produit
      const { data: intent } = await supabaseAdmin
        .from('payment_intents')
        .select(`status, store_products(reward_amount, reward_type)`)
        .eq('id', intentId)
        .single();

      if (intent && intent.status !== 'completed') {
        // CALCUL DU TOTAL : (Valeur de base) x (Quantité achetée)
        const baseReward = intent.store_products.reward_amount;
        const totalReward = baseReward * quantity;
        const rewardType = intent.store_products.reward_type;

        // 4. Marquer l'intention comme finie
        await supabaseAdmin.from('payment_intents').update({ status: 'completed' }).eq('id', intentId);

        // 5. CRÉDITER LE COMPTE
        const { error: walletError } = await supabaseAdmin.from('wallet_transactions').insert({
          user_id: userId,
          amount: totalReward,
          type: 'credit',
          currency: currencyCode,
          description: `Achat : ${quantity}x ${rewardType}`,
          reference_id: data.id,
          metadata: { 
            processed: false, 
            reward_type: rewardType // On transmet le type pour que Godot sache quoi faire
          }
        });

        if (walletError) throw walletError;
      }
      return new Response("OK", { status: 200 });
    }
    return new Response("Ignored", { status: 200 });
  } catch (e) {
    return new Response(e.message, { status: 500 });
  }
})
