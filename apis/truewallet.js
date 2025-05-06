const fetch = require('node-fetch'); // ใช้ได้กับ CommonJS (require)

const redeemvouchers = async (voucher_code) => {
  const data = { mobile: "0989999999" };

  try {
    const response = await fetch(`https://gift.truemoney.com/campaign/vouchers/${voucher_code}/redeem`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    const resjson = await response.json();

    if (resjson.status && resjson.status.code === 'SUCCESS') {
      return {
        status: 'SUCCESS',
        amount: parseInt(resjson.data.voucher.redeemed_amount_baht)
      };
    } else {
      console.log("Redeem failed:", resjson);
      return { status: 'FAILED', error: resjson };
    }

  } catch (err) {
    console.error("Fetch error:", err);
    return { status: 'ERROR', error: err };
  }
};

module.exports = { redeemvouchers };
