<?php

declare(strict_types=1);

define('DB_HOST', getenv('DB_HOST') ?: 'localhost' );
define('DB_NAME', getenv('DB_NAME') ?: 'default_db');
define('DB_USER', getenv('DB_USER') ?: 'root'      );
define('DB_PASS', getenv('DB_PASS') ?: ''          );

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
    logError("Falha na conexão: " . $e->getMessage());
    die("Erro ao conectar ao banco de dados.");
}

?>
