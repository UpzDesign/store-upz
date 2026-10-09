<?php
declare(strict_types=1);
header('Content-Type: application/json');
header('Cache-Control: no-store');
$key = getenv('UPZ_STORAGE_KEY') ?: '';
$provided = $_SERVER['HTTP_X_UPZ_STORAGE_KEY'] ?? '';
if (!$key || !hash_equals($key, $provided)) {
  http_response_code(403);
  echo json_encode(['error' => 'Forbidden']);
  exit;
}
$root = dirname($_SERVER['DOCUMENT_ROOT']) . '/upz-private-files';
if (!is_dir($root) && !mkdir($root, 0700, true)) {
  http_response_code(500); echo json_encode(['error' => 'Storage unavailable']); exit;
}
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
  $file = $_FILES['file'] ?? null;
  $projectId = filter_input(INPUT_POST, 'projectId', FILTER_VALIDATE_INT);
  if (!$file || !$projectId || $file['error'] !== UPLOAD_ERR_OK || $file['size'] < 1 || $file['size'] > 26214400) {
    http_response_code(400); echo json_encode(['error' => 'Invalid upload']); exit;
  }
  $name = basename((string)$file['name']);
  $extension = strtolower(pathinfo($name, PATHINFO_EXTENSION));
  $allowed = ['jpg','jpeg','png','webp','gif','pdf','zip','txt','tif','tiff','svg','ai','eps','psd'];
  if (!in_array($extension, $allowed, true)) {
    http_response_code(400); echo json_encode(['error' => 'File type not allowed']); exit;
  }
  $id = bin2hex(random_bytes(20));
  $folder = $root . '/' . $projectId;
  if (!is_dir($folder) && !mkdir($folder, 0700, true)) {
    http_response_code(500); echo json_encode(['error' => 'Unable to create folder']); exit;
  }
  if (!move_uploaded_file($file['tmp_name'], $folder . '/' . $id)) {
    http_response_code(500); echo json_encode(['error' => 'Unable to store file']); exit;
  }
  echo json_encode(['id' => $id]);
  exit;
}
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
  $projectId = filter_input(INPUT_GET, 'projectId', FILTER_VALIDATE_INT);
  $id = (string)($_GET['id'] ?? '');
  if (!$projectId || !preg_match('/^[a-f0-9]{40}$/', $id)) {
    http_response_code(400); echo json_encode(['error' => 'Invalid file']); exit;
  }
  $path = $root . '/' . $projectId . '/' . $id;
  if (!is_file($path)) {
    http_response_code(404); echo json_encode(['error' => 'Not found']); exit;
  }
  header('Content-Type: application/octet-stream');
  header('Content-Length: ' . filesize($path));
  readfile($path);
  exit;
}
http_response_code(405); echo json_encode(['error' => 'Method not allowed']);
