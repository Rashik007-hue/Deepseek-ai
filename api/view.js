// language: JavaScript, file: api/view.js
// target: Vercel Serverless Function

export default function handler(req, res) {
  const { type, num, tx, amt } = req.query;

  if (!type || !num || !tx || !amt) {
    return res.status(400).send("Missing parameters");
  }

  // ইনফিনিটি ফ্রি এর আসল লিংক তৈরি
  const BASE_URL = "http://fake-bk-ng-ss.great-site.net";
  let imgUrl = "";
  
  if (type === "bkash") {
    imgUrl = `${BASE_URL}/Fake-Ss-Bk/bKash.php?number=${num}&transaction=${tx}&amount=${amt}`;
  } else if (type === "nagad") {
    imgUrl = `${BASE_URL}/Fake-Ss-Ng/nagad.php?number=${num}&transaction=${tx}&amount=${amt}&charge=10&total=${parseInt(amt)+10}`;
  } else {
    imgUrl = `${BASE_URL}/Ss-Send-Money/bKash.php?number=${num}&transaction=${tx}&amount=${amt}`;
  }

  // HTML পেজ রেন্ডার করা (লিংক হাইড করার ট্রিক)
  res.setHeader("Content-Type", "text/html");
  res.status(200).send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
        <title>Screenshot Viewer</title>
        <style>
            body {
                margin: 0; padding: 0; background-color: #0f172a; 
                display: flex; justify-content: center; align-items: center; 
                height: 100vh; overflow: hidden;
                -webkit-touch-callout: none; /* iOS এ লং-প্রেস বন্ধ */
                -webkit-user-select: none; /* সিলেক্ট বন্ধ */
                -khtml-user-select: none;
                -moz-user-select: none;
                -ms-user-select: none;
                user-select: none;
            }
            .image-wrapper {
                position: relative; width: 100%; height: 100%;
                display: flex; justify-content: center; align-items: center;
            }
            img {
                max-width: 100%; max-height: 100%; object-fit: contain;
                pointer-events: none; /* ইমেজে ক্লিক বা ড্র্যাগ করা যাবে না */
            }
            /* পুরো স্ক্রিনে একটা ট্রান্সপারেন্ট লেয়ার দেওয়া হলো যাতে কেউ ইমেজ ধরতে না পারে */
            .overlay {
                position: absolute; top: 0; left: 0; width: 100%; height: 100%; z-index: 10;
            }
        </style>
    </head>
    <body>
        <div class="image-wrapper">
            <img src="${imgUrl}" alt="Screenshot">
            <div class="overlay" oncontextmenu="return false;"></div>
        </div>
    </body>
    </html>
  `);
                }
