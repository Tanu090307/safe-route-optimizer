import rasterio

file_path = r"C:\spider\hack_at_on\data\SVDNB_npp_20251001-20251031_75N060E_vcmslcfg_v10_c202511071000.avg_rade9h.tif"

with rasterio.open(file_path) as src:
    print("CRS:", src.crs)
    print("Bounds:", src.bounds)
    print("Width x Height:", src.width, src.height)
