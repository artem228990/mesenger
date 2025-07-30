<?php
header('Content-Type: application/json');

// Налаштування
$uploadDir = 'uploads/';
$maxFileSize = 5 * 1024 * 1024; // 5MB
$allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
$adminEmail = '2107arhaika@gmail.com';

// Перевірка обов'язкових полів
$requiredFields = ['firstName', 'lastName', 'phone', 'email', 'height', 'weight', 'waist', 'region', 'city', 'department'];
$missingFields = [];

foreach ($requiredFields as $field) {
    if (empty($_POST[$field])) {
        $missingFields[] = $field;
    }
}

if (!empty($missingFields)) {
    echo json_encode([
        'success' => false,
        'message' => 'Будь ласка, заповніть всі обов\'язкові поля: ' . implode(', ', $missingFields)
    ]);
    exit;
}

// Обробка файлу
$fileInfo = [
    'uploaded' => false,
    'path' => null,
    'error' => null
];

if (isset($_FILES['payment-proof']) && $_FILES['payment-proof']['error'] === UPLOAD_ERR_OK) {
    $file = $_FILES['payment-proof'];
    
    // Перевірка розміру
    if ($file['size'] > $maxFileSize) {
        $fileInfo['error'] = 'Файл занадто великий. Максимальний розмір: 5MB.';
    }
    // Перевірка типу
    elseif (!in_array($file['type'], $allowedTypes)) {
        $fileInfo['error'] = 'Дозволені лише зображення (JPEG, PNG, GIF).';
    }
    else {
        // Створюємо папку для завантажень, якщо її немає
        if (!file_exists($uploadDir)) {
            mkdir($uploadDir, 0755, true);
        }
        
        // Генеруємо унікальне ім'я файлу
        $extension = pathinfo($file['name'], PATHINFO_EXTENSION);
        $filename = uniqid('proof_') . '.' . $extension;
        $targetPath = $uploadDir . $filename;
        
        if (move_uploaded_file($file['tmp_name'], $targetPath)) {
            $fileInfo['uploaded'] = true;
            $fileInfo['path'] = $targetPath;
        } else {
            $fileInfo['error'] = 'Помилка при завантаженні файлу.';
        }
    }
}

// Формуємо лист
$subject = 'Нове замовлення: ' . $_POST['product-name'];
$message = "Нове замовлення:\n\n";
$message .= "Товар: " . $_POST['product-name'] . "\n";
$message .= "Ціна: " . $_POST['product-price'] . "\n\n";
$message .= "Дані клієнта:\n";
$message .= "Ім'я: " . $_POST['firstName'] . " " . $_POST['lastName'] . "\n";
$message .= "Телефон: " . $_POST['phone'] . "\n";
$message .= "Email: " . $_POST['email'] . "\n";
$message .= "Розміри: зріст " . $_POST['height'] . " см, вага " . $_POST['weight'] . " кг, талія " . $_POST['waist'] . " см\n";
$message .= "Адреса: " . $_POST['region'] . " обл., м. " . $_POST['city'] . ", відділення НП: " . $_POST['department'] . "\n";
$message .= "Побажання: " . ($_POST['notes'] ?? 'немає') . "\n";
$message .= "Оплата: " . ($fileInfo['uploaded'] ? "Доказ оплати додано (" . basename($fileInfo['path']) . ")" : 
              ($fileInfo['error'] ? "Помилка завантаження доказу: " . $fileInfo['error'] : "Доказ оплати не надано")) . "\n";

// Відправка листа
$headers = "From: " . $_POST['email'] . "\r\n";
$headers .= "Reply-To: " . $_POST['email'] . "\r\n";

// Якщо є файл, спробуємо додати його як вкладення (потребує додаткового налаштування сервера)
if ($fileInfo['uploaded']) {
    $boundary = md5(time());
    $headers .= "MIME-Version: 1.0\r\n";
    $headers .= "Content-Type: multipart/mixed; boundary=\"$boundary\"\r\n";
    
    $body = "--$boundary\r\n";
    $body .= "Content-Type: text/plain; charset=utf-8\r\n";
    $body .= "Content-Transfer-Encoding: 7bit\r\n\r\n";
    $body .= $message . "\r\n\r\n";
    $body .= "--$boundary\r\n";
    $body .= "Content-Type: application/octet-stream; name=\"" . basename($fileInfo['path']) . "\"\r\n";
    $body .= "Content-Transfer-Encoding: base64\r\n";
    $body .= "Content-Disposition: attachment\r\n\r\n";
    $body .= chunk_split(base64_encode(file_get_contents($fileInfo['path']))) . "\r\n";
    $body .= "--$boundary--";
    
    $message = $body;
}

$mailSent = mail($adminEmail, $subject, $message, $headers);

// Відповідь клієнту
echo json_encode([
    'success' => $mailSent,
    'message' => $mailSent ? 'Замовлення успішно відправлено' : 'Помилка при відправці замовлення',
    'file_info' => $fileInfo
]);
?>