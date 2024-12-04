<?php

declare(strict_types=1);

include_once '../includes/process.php';
include_once '../includes/logger.php';

header('Content-Type: application/json');

function sendJsonResponse(array $data, int $statusCode = 200): void
{
    http_response_code($statusCode);
    echo json_encode($data);
    exit;
}

function handlePostRequest(): void
{
    $rawInput = file_get_contents('php://input');

    if (empty($rawInput))
    {
        logMessage("Erro: Requisição POST com corpo vazio.");
        sendJsonResponse(['status' => 'error', 'message' => 'Corpo da requisição está vazio'], 400);
    }

    $lines = explode(';', $rawInput);
    foreach ($lines as $line)
    {
        if (trim($line) === '')
            continue;

        list($key, $value) = array_map('trim', explode(',', $line));
        $key   = (int)$key;

        if ($key == 6 || $key == 7)
            $value = (float)$value;
        else
            $value = (int)$value;

        if ($key < 0)
        {
            logMessage("Erro: ID CAN inválido: $key");
            sendJsonResponse(['status' => 'error', 'message' => "ID CAN inválido: $key"], 400);
        }

        if (!is_numeric($value))
        {
            logMessage("Erro: Valor inválido para ID CAN $key: $value");
            sendJsonResponse(['status' => 'error', 'message' => "Valor inválido para ID CAN $key: $value"], 400);
        }

        try 
        {
            salvarDado($key, $value);
        }
        catch (Exception $e)
        {
            logMessage("Erro ao salvar dados para ID CAN $key: " . $e->getMessage());
            sendJsonResponse(['status' => 'error', 'message' => "Erro ao salvar dados para ID CAN $key"], 500);
        }
    }

    sendJsonResponse(['status' => 'success', 'message' => 'Dados processados e salvos com sucesso']);
}

function handleGetRequest(): void
{
    try
    {
        $dados = buscarDados();
        sendJsonResponse(['status' => 'success', 'data' => $dados]);
    }
    catch (Exception $e)
    {
        logMessage("Erro ao buscar todos os dados: " . $e->getMessage());
        sendJsonResponse(['status' => 'error', 'message' => 'Erro ao buscar todos os dados'], 500);
    }
}

$requestMethod = $_SERVER['REQUEST_METHOD'];

if     ($requestMethod === 'POST') handlePostRequest();
elseif ($requestMethod === 'GET' ) handleGetRequest();
else 
{
    logMessage("Requisição inválida. Método não suportado: $requestMethod.");
    sendJsonResponse(['status' => 'error', 'message' => 'Método não suportado'], 405);
}

?>