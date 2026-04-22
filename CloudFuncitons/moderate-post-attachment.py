import functions_framework
from google.cloud import firestore, vision, storage
from datetime import datetime, timezone

"""
This cloud function is used to moderate ATTACHMENT posts.
It uses Google Cloud Vision API to scan images for inappropriate content.
If the image is flagged above a certain rating, a flood occurs.

Categories have the same severity level, so they require the same score each
to trigger a flood.

Categories:
- Violence: anything that is graphic. Can potentially be triggered by cartoony violence,
            or sports. This one may be a bit sensitive.
- Racy:     anything suggestive or provocative, but not explicit nudity or sexual activity.
- Adult:    any explicit nudity or pornographic content.
        
NOTE:   Vision API can only analyze the first FRAME of GIFS,
        so we pray no one posts something that's fine in the first frame
        but inappropriate in later frames.

Had to read official documentation for this:
https://docs.cloud.google.com/vision/docs/features-list

"""
