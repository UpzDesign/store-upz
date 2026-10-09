# UPZ cPanel storage setup

The UPZ interface stays at https://store.upzdesign.com. File bytes are stored on the existing upzdesign.com cPanel account. Do not point the store hostname away from Vercel.

## cPanel
1. In the upzdesign.com web root, create the folder `upz-storage` and upload `storage-cpanel/upload.php` from this repository to `upz-storage/upload.php`.
2. The script creates `upz-private-files` one level ABOVE the site's document root. Confirm the PHP user can write there; never place that directory inside public_html.
3. Set a long random `UPZ_STORAGE_KEY` in the PHP process environment. For Apache setups supporting it, an .htaccess file outside the public directory can set `SetEnv UPZ_STORAGE_KEY your-long-random-key`. For PHP-FPM use your host's supported environment variable mechanism instead. Do not commit the key.
4. Ensure the endpoint `https://upzdesign.com/upz-storage/upload.php` resolves over HTTPS. An unauthenticated request should return HTTP 403.
5. Check PHP settings `upload_max_filesize` and `post_max_size` are at least 5M.

## Vercel
Configure the following environment variables for the UPZ store project:
- `UPZ_STORAGE_ENDPOINT=https://upzdesign.com/upz-storage/upload.php`
- `UPZ_STORAGE_KEY` = exactly the same private value used on cPanel

Redeploy after adding variables. Never expose the key with a `NEXT_PUBLIC_` prefix.

## Using it
Open Admin → Project → Files, select multiple files and upload. Files are recorded in the project's internal activity and downloaded via authenticated `store.upzdesign.com/api/admin/files/{id}` URLs.

**Initial limitation:** This version uses a Vercel upload proxy, so individual files must be smaller than 4 MB. Larger production artwork requires a subsequent direct-to-storage signed-upload workflow. Existing Deliverables and Daily Log links are unchanged. Files are private to authorized staff; client sharing is not enabled yet.

**Deployment order:** Set up cPanel script and matching secrets, then trigger Vercel deployment. Until configured, the upload route returns a configuration error.
