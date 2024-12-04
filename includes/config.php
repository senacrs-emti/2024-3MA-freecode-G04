<?php

declare(strict_types=1);

define('DB_HOST', getenv('DB_HOST') ?: '');
define('DB_NAME', getenv('DB_NAME') ?: '');
define('DB_USER', getenv('DB_USER') ?: '');
define('DB_PASS', getenv('DB_PASS') ?: '');

try
{
    $pdo = new PDO(
        "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=utf8mb4",
        DB_USER,
        DB_PASS
    );

    $pdo->setAttribute(PDO::ATTR_ERRMODE           , PDO::ERRMODE_EXCEPTION);
    $pdo->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC      );
    $pdo->setAttribute(PDO::ATTR_EMULATE_PREPARES  , false                 );
}
catch (PDOException $e)
{
    die("Erro ao conectar ao banco de dados.");
}

?>
