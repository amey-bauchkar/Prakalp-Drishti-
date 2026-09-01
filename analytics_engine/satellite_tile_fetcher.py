import os
import time
import requests
import logging

from pathlib import Path
from typing import Dict, Any

logger = logging.getLogger(__name__)

# Constants for satellite fetching
IMAGERY_DIR = Path("paimana_extracted/satellite_data/project_imagery")
TILE_SIZE = 800
DELTA_DEG = 0.006  # ~1.3km bounding box
TIMEOUT_SEC = 15
MIN_IMAGE_BYTES = 10240  # 10 KB

def fetch_satellite_tiles(project_id: str, lat: float, lon: float, sector: str = None, timeout: int = TIMEOUT_SEC) -> Dict[str, Any]:
    """
    Fetches real satellite imagery tiles for a given project coordinate.
    - BEFORE image: Sentinel-2 Cloudless 2018 (Historical baseline)
    - AFTER image: ESRI World Imagery (Current optical)
    
    Returns a dictionary with fetch results and saves the valid images to disk.
    Does not crash on network failure; gracefully returns success=False.
    """
    result = {
        "success": False,
        "before_bytes": 0,
        "after_bytes": 0,
        "fetch_time_ms": 0,
        "error": None
    }
    
    if not lat or not lon:
        result["error"] = "Missing coordinates"
        return result
        
    try:
        lat = float(lat)
        lon = float(lon)
    except ValueError:
        result["error"] = "Invalid coordinates"
        return result
        
    t0 = time.time()
    
    # Bounding Box
    min_lon = lon - DELTA_DEG
    min_lat = lat - DELTA_DEG
    max_lon = lon + DELTA_DEG
    max_lat = lat + DELTA_DEG
    
    # URL configurations
    esri_url = f"https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/export?bbox={min_lon},{min_lat},{max_lon},{max_lat}&bboxSR=4326&imageSR=4326&size={TILE_SIZE},{TILE_SIZE}&format=jpg&f=image"
    s2_url = f"https://tiles.maps.eox.at/wms?service=wms&request=getmap&version=1.1.1&layers=s2cloudless-2018&styles=&format=image/jpeg&transparent=false&srs=epsg:4326&bbox={min_lon},{min_lat},{max_lon},{max_lat}&width={TILE_SIZE}&height={TILE_SIZE}"
    
    try:
        # Fetch AFTER (Current)
        r_after = requests.get(esri_url, timeout=timeout)
        r_after.raise_for_status()
        after_content = r_after.content
        
        # Fetch BEFORE (Historical)
        r_before = requests.get(s2_url, timeout=timeout)
        r_before.raise_for_status()
        before_content = r_before.content
        
        # Validate JPEGs (JFIF magic bytes)
        jfif_magic = bytes([0xFF, 0xD8, 0xFF])
        if not after_content.startswith(jfif_magic) or len(after_content) < MIN_IMAGE_BYTES:
            raise ValueError(f"Invalid AFTER image format or size: {len(after_content)} bytes")
            
        if not before_content.startswith(jfif_magic) or len(before_content) < MIN_IMAGE_BYTES:
            raise ValueError(f"Invalid BEFORE image format or size: {len(before_content)} bytes")
            
        # Ensure directory exists
        IMAGERY_DIR.mkdir(parents=True, exist_ok=True)
        
        # Save to disk
        pid = str(project_id)
        before_path = IMAGERY_DIR / f"{pid}_BEFORE.jpg"
        after_path = IMAGERY_DIR / f"{pid}_AFTER.jpg"
        
        with open(before_path, "wb") as f:
            f.write(before_content)
            
        with open(after_path, "wb") as f:
            f.write(after_content)
            
        result["success"] = True
        result["before_bytes"] = len(before_content)
        result["after_bytes"] = len(after_content)
        
    except requests.RequestException as e:
        result["error"] = f"Network error: {str(e)}"
        logger.warning(f"Satellite fetch failed for project {project_id}: {result['error']}")
    except ValueError as e:
        result["error"] = str(e)
        logger.warning(f"Satellite fetch invalid for project {project_id}: {result['error']}")
    except Exception as e:
        result["error"] = f"Unexpected error: {str(e)}"
        logger.error(f"Satellite fetch exception for project {project_id}: {result['error']}", exc_info=True)
        
    t1 = time.time()
    result["fetch_time_ms"] = int((t1 - t0) * 1000)
    
    return result
