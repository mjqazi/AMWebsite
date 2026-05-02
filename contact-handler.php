<?php
// Advanced Mechanix — consultation form handler
// Accepts POST from /contact.html, sends email to company@advancedmechanix.com,
// returns JSON. Same-origin only. Honeypot bot-trap. Header-injection safe.

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');
header('X-Content-Type-Options: nosniff');

function fail($msg, $code = 400) {
    http_response_code($code);
    echo json_encode(['ok' => false, 'error' => $msg]);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') fail('Method not allowed', 405);

// Same-origin guard via Origin / Referer
$allowed_host = 'advancedmechanix.com';
$origin = $_SERVER['HTTP_ORIGIN'] ?? $_SERVER['HTTP_REFERER'] ?? '';
if ($origin !== '' && strpos($origin, $allowed_host) === false) fail('Bad origin', 403);

// Honeypot: real users won't fill this hidden field
if (!empty($_POST['website'] ?? '')) {
    // Pretend success so bots don't retry
    echo json_encode(['ok' => true]);
    exit;
}

// Collect + sanitize
$name    = trim((string)($_POST['name']    ?? ''));
$company = trim((string)($_POST['company'] ?? ''));
$email   = trim((string)($_POST['email']   ?? ''));
$phone   = trim((string)($_POST['phone']   ?? ''));
$service = trim((string)($_POST['service'] ?? ''));
$time    = trim((string)($_POST['time']    ?? ''));
$message = trim((string)($_POST['message'] ?? ''));

if ($name === '')  fail('Name is required');
if ($email === '') fail('Email is required');
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) fail('Email is not valid');

// Length caps
foreach (['name'=>$name,'company'=>$company,'email'=>$email,'phone'=>$phone,'service'=>$service,'time'=>$time] as $k=>$v) {
    if (strlen($v) > 200) fail("$k is too long");
}
if (strlen($message) > 5000) fail('Message is too long');

// Strip CR/LF from any field that goes into headers (injection guard)
$strip = fn($s) => str_replace(["\r","\n","\0"], '', $s);
$safe_email = $strip($email);
$safe_name  = $strip($name);

$to      = 'company@advancedmechanix.com';
$subject = '[Website Consultation] ' . $strip($name) . ($company !== '' ? ' / ' . $strip($company) : '');

$body  = "New consultation request from advancedmechanix.com\n";
$body .= "================================================\n\n";
$body .= "Name:    $name\n";
$body .= "Company: $company\n";
$body .= "Email:   $email\n";
$body .= "Phone:   $phone\n";
$body .= "Service: $service\n";
$body .= "Time:    $time\n\n";
$body .= "Message:\n--------\n$message\n\n";
$body .= "================================================\n";
$body .= "IP:        " . ($_SERVER['REMOTE_ADDR'] ?? '-') . "\n";
$body .= "User-Agent: " . substr($_SERVER['HTTP_USER_AGENT'] ?? '-', 0, 200) . "\n";
$body .= "Submitted: " . gmdate('c') . " UTC\n";

$headers  = "From: Advanced Mechanix <company@advancedmechanix.com>\r\n";
$headers .= "Reply-To: $safe_name <$safe_email>\r\n";
$headers .= "X-Mailer: AM-WebForm/1.0\r\n";
$headers .= "MIME-Version: 1.0\r\n";
$headers .= "Content-Type: text/plain; charset=UTF-8\r\n";

$sent = @mail($to, $subject, $body, $headers, '-fcompany@advancedmechanix.com');

if (!$sent) fail('Could not send message right now. Please email us directly at company@advancedmechanix.com.', 500);

echo json_encode(['ok' => true]);
