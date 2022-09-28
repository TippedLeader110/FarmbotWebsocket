import cv2
import base64
import random
import json
import time
import os
import imageio.v2 as imageio
import numpy as np

def set_manual_exposure(dev_video_id, exposure_time):
    commands = [
        ("v4l2-ctl --device /dev/video"+str(id)+" -c exposure_auto=3"),
        ("v4l2-ctl --device /dev/video"+str(id)+" -c exposure_auto=1"),
        ("v4l2-ctl --device /dev/video"+str(id)+" -c exposure_absolute=")
    ]
    for c in commands: 
        os.system(c)

# set_manual_exposure(2, 1)


def img_estim(img, thrshld):
    # print(np.mean(img))
    is_light = np.mean(img) > thrshld
    return 'light' if is_light else 'dark'


os.system("v4l2-ctl --device /dev/video2 -c exposure_auto=1")
os.system("v4l2-ctl --device /dev/video2 -c exposure_absolute=28")

cam = cv2.VideoCapture(2)
# cam.set(cv2.CAP_PROP_AUTO_EXPOSURE, )



# cv2.namedWindow("test")
if cam.isOpened():
    time.sleep(5)
    img_counter = 0
    data = {}
    ret, frame = cam.read()
    img_name = "farmbot_capture_{}.png".format(random.randint(0, 10000000000000))
    cv2.imwrite('./camera/body_' + img_name, frame)
    f = imageio.imread('./camera/body_' + img_name, as_gray=True)
    # print(img_estim(f, 80))
    if(img_estim(f, 80)=='dark'):
        os.system("v4l2-ctl --device /dev/video2 -c exposure_absolute=40")
        cam.release()
        cam = cv2.VideoCapture(2)
        ret, frame = cam.read()
        cv2.imwrite('./camera/body_' + img_name, frame)

    imgstring = base64.b64encode(frame);
    data['nama'] = 'body_' + img_name
    data['b64'] = imgstring.decode('ascii')
    # value = json.dumps(data)
    # value = json.loads(value)
    # value = "{ status : true,  nama : '" + str(img_name) + "', b64 : '" + str(imgstring.encode()) + "'}";
    # print("{} written!".format(img_name))
    cam.release()
    print(img_name)
    # img_counter += 1
else:
    print("false")
cv2.destroyAllWindows()