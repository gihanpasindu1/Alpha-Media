from apify_client import ApifyClient

client = ApifyClient('apify_api_hro6RurENeFmPkXfidh6dZaikfxbtN4jsodI')

print("Starting Apify run...")
run = client.actor('epctex/youtube-video-downloader').call(
    run_input={'startUrls': [{'url': 'https://www.youtube.com/watch?v=bhKKR5He_Fo'}]}
)

print(dir(run))
dataset_id = run.get("defaultDatasetId") if hasattr(run, "get") else run.defaultDatasetId if hasattr(run, "defaultDatasetId") else run.get('defaultDatasetId') if type(run)==dict else run["defaultDatasetId"]
print(f"Dataset ID: {dataset_id}")

items = client.dataset(dataset_id).list_items().items
print("Items:", items)
