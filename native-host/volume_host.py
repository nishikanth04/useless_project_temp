import sys
import json
import struct
from ctypes import cast, POINTER
from comtypes import CLSCTX_ALL, CoCreateInstance
from pycaw.pycaw import (
    MMDeviceEnumerator,
    IMMDeviceEnumerator,
    IAudioEndpointVolume
)

def get_volume_control():
    # Direct Windows WASAPI device endpoint query
    # 0 = eRender (Playback), 1 = eMultimedia (Speakers/Default Audio)
    enumerator = CoCreateInstance(
        MMDeviceEnumerator,
        IMMDeviceEnumerator,
        CLSCTX_ALL
    )
    endpoint = enumerator.GetDefaultAudioEndpoint(0, 1)
    interface = endpoint.Activate(IAudioEndpointVolume._iid_, CLSCTX_ALL, None)
    return cast(interface, POINTER(IAudioEndpointVolume))

def read_message():
    raw_length = sys.stdin.buffer.read(4)
    if not raw_length or len(raw_length) < 4:
        sys.exit(0)
    length = struct.unpack('@I', raw_length)[0]
    payload = sys.stdin.buffer.read(length).decode('utf-8')
    return json.loads(payload)

def main():
    volume_endpoint = get_volume_control()
    while True:
        try:
            msg = read_message()
            if "volume" in msg:
                clamped_vol = max(0.0, min(1.0, float(msg["volume"])))
                volume_endpoint.SetMasterVolumeLevelScalar(clamped_vol, None)
        except Exception:
            sys.exit(0)

if __name__ == "__main__":
    main()