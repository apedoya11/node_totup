const express = require('express');
const puppeteer = require('puppeteer');

const app = express();
const port = 3000;

// เพิ่ม route สำหรับหน้าแรก '/'
app.get('/', (req, res) => {
  res.send('Welcome! Please provide a voucherHash in the URL like this: /:voucherHash');
});

// สร้าง route สำหรับรับแค่ voucherHash จาก URL path
app.get('/:voucherHash', async (req, res) => {
  const { voucherHash } = req.params;  // ดึงค่า voucherHash จาก URL

  if (!voucherHash) {
    return res.status(400).json({ error: 'voucherHash is required' });
  }

  const mobile = '0623014251';  // ค่า mobile ตั้งไว้แบบนี้ในโค้ด

  const url = `https://gift.truemoney.com/campaign/vouchers/${voucherHash}/verify?mobile=${mobile}`;

  try {
    // เริ่มต้น puppeteer และเข้าถึงหน้าเว็บ
    const browser = await puppeteer.launch({
      headless: true, // เปลี่ยนเป็น true หากต้องการแบบไม่มีหน้าต่าง
      slowMo: 50,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36');
    await page.goto(url, { waitUntil: 'networkidle2' });

    let jsonData = {};

    try {
      // ดึงข้อมูล JSON จากหน้าต่าง
      jsonData = await page.evaluate(() => {
        return JSON.parse(document.querySelector("body").innerText);
      });
    } catch (err) {
      console.error('❌ JSON parse error:', err);
      jsonData = { rawContent: await page.content() };  // กรณีเกิดข้อผิดพลาด
    }

    let result;

    if (jsonData.status.code !== "SUCCESS") {
      result = {
        success: false,
        message: "ซองไม่ถูกต้อง"
      };
    } else if (jsonData.data.voucher.member !== 1) {
      result = {
        success: false,
        message: "ผู้รับซองต้องเป็น 1 คน"
      };
    } else {
      result = {
        success: true,
        amount_baht: jsonData.data.voucher.amount_baht
      };
    }

    // ส่งผลลัพธ์กลับเป็น JSON
    res.json(result);

    await browser.close();
  } catch (err) {
    console.error('❌ Puppeteer error:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// เริ่มเซิร์ฟเวอร์ที่ port 3000
app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});
