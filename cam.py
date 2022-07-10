import cv2
import base64
import random
import json

cam = cv2.VideoCapture(0)

# cv2.namedWindow("test")

img_counter = 0
data = {}
ret, frame = cam.read()
img_name = "farmbot_capture_{}.png".format(random.randint(0, 10000000000000))
cv2.imwrite('/var/www/farmbot-yii2/web/img/daun' + img_name, frame)
imgstring = base64.b64encode(frame);
data['nama'] = img_name
data['b64'] = imgstring.decode('ascii')
# value = json.dumps(data)
# value = json.loads(value)
# value = "{ nama : '" + str(img_name) + "', b64 : '" + str(imgstring.encode()) + "'}";
# print("{} written!".format(img_name))
print(img_name)
img_counter += 1

cam.release()
cv2.destroyAllWindows()