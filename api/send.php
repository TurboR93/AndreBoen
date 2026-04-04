<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

// ── Config ──
$TO_EMAIL = 'info@andreaboen.com';  // Cambia con la tua email
$FROM_EMAIL = 'noreply@andreaboen.com';

$input = json_decode(file_get_contents('php://input'), true);
if (!$input || !isset($input['type'])) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid request']);
    exit;
}

$type = $input['type'];

// ── Build email based on form type ──
switch ($type) {
    case 'contatti':
        $name = htmlspecialchars($input['name'] ?? '');
        $email = filter_var($input['email'] ?? '', FILTER_VALIDATE_EMAIL);
        $message = htmlspecialchars($input['message'] ?? '');

        if (!$name || !$email || !$message) {
            http_response_code(400);
            echo json_encode(['error' => 'Missing required fields']);
            exit;
        }

        $subject = "Nuovo messaggio da $name";
        $body = "
<html><body style='font-family: Inter, sans-serif; color: #1a1a1a; max-width: 600px; margin: 0 auto;'>
<div style='background: #722F37; padding: 20px; text-align: center;'>
  <h1 style='color: #C5A572; margin: 0; font-family: Playfair Display, serif;'>Andrea Boen</h1>
  <p style='color: #FFF8F0; margin: 5px 0 0; font-size: 12px;'>Wine Relations</p>
</div>
<div style='padding: 30px; background: #FFF8F0;'>
  <h2 style='color: #722F37; font-family: Playfair Display, serif;'>Nuovo messaggio dal sito</h2>
  <table style='width: 100%; border-collapse: collapse;'>
    <tr><td style='padding: 8px 0; color: #888; width: 120px;'>Nome</td><td style='padding: 8px 0;'><strong>$name</strong></td></tr>
    <tr><td style='padding: 8px 0; color: #888;'>Email</td><td style='padding: 8px 0;'><a href='mailto:$email'>$email</a></td></tr>
  </table>
  <div style='margin-top: 20px; padding: 15px; background: #fff; border-left: 3px solid #C5A572;'>
    <p style='margin: 0; color: #888; font-size: 12px;'>Messaggio</p>
    <p style='margin: 8px 0 0;'>$message</p>
  </div>
</div>
<div style='padding: 15px; text-align: center; color: #888; font-size: 11px;'>
  Inviato dal form Contatti &mdash; andreaboen.com
</div>
</body></html>";
        $replyTo = $email;
        break;

    case 'buyer':
        $company = htmlspecialchars($input['company'] ?? '');
        $country = htmlspecialchars($input['country'] ?? '');
        $types = htmlspecialchars(implode(', ', $input['types'] ?? []));
        $markets = htmlspecialchars(implode(', ', $input['markets'] ?? []));
        $categories = htmlspecialchars(implode(', ', $input['categories'] ?? []));
        $preferences = htmlspecialchars($input['preferences'] ?? '');
        $priceRange = htmlspecialchars($input['priceRange'] ?? '');
        $volume = htmlspecialchars($input['volume'] ?? '');
        $notes = htmlspecialchars($input['notes'] ?? '');

        if (!$company || !$country) {
            http_response_code(400);
            echo json_encode(['error' => 'Missing required fields']);
            exit;
        }

        $subject = "Nuova richiesta Buyer - $company";
        $body = "
<html><body style='font-family: Inter, sans-serif; color: #1a1a1a; max-width: 600px; margin: 0 auto;'>
<div style='background: #722F37; padding: 20px; text-align: center;'>
  <h1 style='color: #C5A572; margin: 0; font-family: Playfair Display, serif;'>Andrea Boen</h1>
  <p style='color: #FFF8F0; margin: 5px 0 0; font-size: 12px;'>Wine Relations</p>
</div>
<div style='padding: 30px; background: #FFF8F0;'>
  <h2 style='color: #722F37; font-family: Playfair Display, serif;'>Nuova richiesta Buyer</h2>
  <table style='width: 100%; border-collapse: collapse;'>
    <tr><td style='padding: 8px 0; color: #888; width: 140px;'>Azienda</td><td style='padding: 8px 0;'><strong>$company</strong></td></tr>
    <tr><td style='padding: 8px 0; color: #888;'>Paese</td><td style='padding: 8px 0;'>$country</td></tr>
    <tr><td style='padding: 8px 0; color: #888;'>Tipologia</td><td style='padding: 8px 0;'>$types</td></tr>
    <tr><td style='padding: 8px 0; color: #888;'>Mercati</td><td style='padding: 8px 0;'>$markets</td></tr>
    <tr><td style='padding: 8px 0; color: #888;'>Categorie</td><td style='padding: 8px 0;'>$categories</td></tr>
    <tr><td style='padding: 8px 0; color: #888;'>Preferenze</td><td style='padding: 8px 0;'>$preferences</td></tr>
    <tr><td style='padding: 8px 0; color: #888;'>Fascia prezzo</td><td style='padding: 8px 0;'>$priceRange</td></tr>
    <tr><td style='padding: 8px 0; color: #888;'>Volume</td><td style='padding: 8px 0;'>$volume</td></tr>
  </table>";

        if ($notes) {
            $body .= "
  <div style='margin-top: 20px; padding: 15px; background: #fff; border-left: 3px solid #C5A572;'>
    <p style='margin: 0; color: #888; font-size: 12px;'>Note</p>
    <p style='margin: 8px 0 0;'>$notes</p>
  </div>";
        }

        $body .= "
</div>
<div style='padding: 15px; text-align: center; color: #888; font-size: 11px;'>
  Inviato dal form Buyer &mdash; andreaboen.com
</div>
</body></html>";
        $replyTo = $FROM_EMAIL;
        break;

    default:
        http_response_code(400);
        echo json_encode(['error' => 'Unknown form type']);
        exit;
}

// ── Send email ──
$headers = "MIME-Version: 1.0\r\n";
$headers .= "Content-Type: text/html; charset=UTF-8\r\n";
$headers .= "From: Andrea Boen <$FROM_EMAIL>\r\n";
$headers .= "Reply-To: $replyTo\r\n";

$sent = mail($TO_EMAIL, $subject, $body, $headers);

if ($sent) {
    echo json_encode(['success' => true]);
} else {
    http_response_code(500);
    echo json_encode(['error' => 'Failed to send email']);
}
