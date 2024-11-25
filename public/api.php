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
    $rawData = file_get_contents('php://input');
    if (empty($rawData))
    {
        logMessage("Erro: Requisição POST com corpo vazio.");
        sendJsonResponse(['status' => 'error', 'message' => 'Corpo da requisição está vazio'], 400);
    }

    $data = json_decode($rawData, true);
    if ($data === null || !is_array($data))
    {
        logMessage("Erro: JSON inválido recebido no POST.");
        sendJsonResponse(['status' => 'error', 'message' => 'JSON inválido'], 400);
    }

    foreach ($data as $key => $value)
    {
        $key = (string)$key;
        $value = (string)$value;

        if (!is_string($key) || !is_string($value))
        {
            logMessage("Erro: Formato inválido para chave: $key ou valor: $value");
            sendJsonResponse(['status' => 'error', 'message' => 'Formato inválido nos dados'], 400);
        }

        try
        {
            salvarDados($key, $value);
        }
        catch (Exception $e)
        {
            logMessage("Erro ao salvar dados para chave: $key. Erro: " . $e->getMessage());
            sendJsonResponse(['status' => 'error', 'message' => "Erro ao salvar dados para chave: $key"], 500);
        }
    }

    sendJsonResponse(['status' => 'success', 'message' => 'Todos os dados foram salvos com sucesso']);
}

function handleGetRequest(): void
{
    logMessage("Requisição GET recebida para buscar dados.");

    try
    {
        $dados = buscarDados();
        sendJsonResponse($dados);
    } 
    catch (Exception $e)
    {
        logMessage("Erro ao buscar dados: " . $e->getMessage());
        sendJsonResponse(['status' => 'error', 'message' => 'Erro ao buscar dados'], 500);
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
