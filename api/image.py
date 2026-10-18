from fastapi import FastAPI, Response
from PIL import Image, ImageDraw, ImageFont
from datetime import datetime
from zoneinfo import ZoneInfo
import io
import os

app = FastAPI()

# ফাইল পাথ সেটআপ (Vercel-এ api ফোল্ডারের ভেতরে ফাইলগুলো থাকতে হবে)
BASE_DIR = os.path.dirname(__file__)
BG_PATH = os.path.join(BASE_DIR, "ss.jpg")
FONT1 = os.path.join(BASE_DIR, "roboto.ttf")
FONT2 = os.path.join(BASE_DIR, "roboto2.ttf")

@app.get("/api/image")
def generate_image(
    number: str = "01986833907", 
    transaction: str = "730MGQG6GH", 
    amount: int = 10000
):
    try:
        # ইমেজ ওপেন করা
        img = Image.open(BG_PATH).convert("RGB")
        draw = ImageDraw.Draw(img)
        image_width = img.width
        
        color = (90, 90, 90) # PHP কোডের রঙ
        total_with_extra = amount + 17
        
        # ফন্ট লোড করা (PHP অনুযায়ী সাইজ)
        f1_55 = ImageFont.truetype(FONT1, 55)
        f2_55 = ImageFont.truetype(FONT2, 55)
        f1_60 = ImageFont.truetype(FONT1, 60)
        f1_50 = ImageFont.truetype(FONT1, 50)
        f2_50 = ImageFont.truetype(FONT2, 50)
        f2_47 = ImageFont.truetype(FONT2, 47)

        # টেক্সট ড্র করা
        draw.text((400, 850), number, font=f1_55, fill=color)
        draw.text((400, 950), number, font=f2_55, fill=color)
        
        # Transaction ID (Right Align)
        bbox = draw.textbbox((0, 0), transaction, font=f1_60)
        text_width = bbox[2] - bbox[0]
        draw.text((image_width - 384 - text_width, 1430), transaction, font=f1_60, fill=color)
        
        # Amounts
        draw.text((175, 1880), f"{amount} +17.39", font=f2_50, fill=color)
        draw.text((170, 1768), str(total_with_extra), font=f1_50, fill=color)

        # ডেট ও টাইম (Dhaka Timezone)
        now = datetime.now(ZoneInfo("Asia/Dhaka"))
        time_str = now.strftime("%I:%M %p") # 12-hour format
        date_str = now.strftime("%d/%m/%y")

        draw.text((135, 1421), time_str, font=f1_50, fill=color)
        draw.text((439, 1420), date_str, font=f1_50, fill=color)
        draw.text((50, 109), time_str, font=f2_47, fill=color)

        # ইমেজটিকে মেমোরিতে সেভ করা
        img_io = io.BytesIO()
        img.save(img_io, format="PNG")
        img_io.seek(0)
        
        return Response(content=img_io.getvalue(), media_type="image/png")

    except Exception as e:
        return Response(content=f"Error: {str(e)}".encode(), media_type="text/plain", status_code=500)
