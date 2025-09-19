import cv2
import requests

# FastAPI 서버에서 signed url 가져오기
resp = requests.get(
    "http://127.0.0.1:5000/get-url?object_key=blackbox-videos/testvideo.mp4"
)
signed_url = resp.json()["signed_url"]

print(signed_url)
cap = cv2.VideoCapture(signed_url)

if not cap.isOpened():
    print("VideoCapture failed to open the URL.")
    exit()

cv2.namedWindow("Frame", cv2.WINDOW_NORMAL)

while True:
    ret, frame = cap.read()
    if not ret:
        break
    win_width = cv2.getWindowImageRect("Frame")[2]
    win_height = cv2.getWindowImageRect("Frame")[3]
    resized_frame = cv2.resize(frame, (win_width, win_height))
    cv2.imshow("Frame", resized_frame)
    if cv2.waitKey(25) & 0xFF == ord("q"):
        break

cap.release()
cv2.destroyAllWindows()
