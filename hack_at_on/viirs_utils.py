import rasterio
import numpy as np

VIIRS_FILE = r"C:\spider\hack_at_on\data\SVDNB_npp_20251001-20251031_75N060E_vcmslcfg_v10_c202511071000.avg_rade9h.tif"

dataset = rasterio.open(VIIRS_FILE)

def get_brightness(lat, lon):
    try:
        row, col = dataset.index(lon, lat)
        value = dataset.read(1)[row, col]

        if np.isnan(value) or value < 0:
            return 0.0

        return float(value)

    except Exception:
        return 0.0
