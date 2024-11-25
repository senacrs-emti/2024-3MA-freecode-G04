<?php

declare(strict_types=1);

function logMessage(string $message, string $logDirectory = '../logs/', ?string $logFile = null): void
{
    $logDirectory = rtrim($logDirectory, DIRECTORY_SEPARATOR) . DIRECTORY_SEPARATOR;

    if (!is_dir($logDirectory) && !mkdir($logDirectory, 0777, true) && !is_dir($logDirectory))
        throw new RuntimeException("Falha ao criar o diretório de logs: {$logDirectory}");

    if (!is_writable($logDirectory))
        throw new RuntimeException("O diretório de logs não é gravável: {$logDirectory}");

    $logFile = $logFile ?? $logDirectory . date('Y-m-d') . '.log';
    $formattedMessage = sprintf("[%s] - %s\n", date('Y-m-d H:i:s'), $message);
    if (file_put_contents($logFile, $formattedMessage, FILE_APPEND) === false)
        throw new RuntimeException("Falha ao escrever no arquivo de log: {$logFile}");
}

?>
