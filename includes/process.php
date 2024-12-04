<?php

declare(strict_types=1);

include_once '../includes/config.php';
include_once '../includes/logger.php';

function salvarDado(int $idCan, $value): void
{
    global $pdo;

    try 
    {
        $pdo->beginTransaction();
        
        $sql = "INSERT INTO dados (`key`, `value`, `timestamp`) VALUES (:key, :value, :timestamp)";

        $stmt = $pdo->prepare($sql);
        $stmt->bindValue(':key'      , $idCan, PDO::PARAM_INT);
        $stmt->bindValue(':value'    , $value, PDO::PARAM_STR);
        $stmt->bindValue(':timestamp', time(), PDO::PARAM_INT);

        $stmt->execute();
        $pdo->commit();
    }
    catch (Exception $e)
    {
        $pdo->rollBack();
        logMessage("Erro ao salvar dados no banco: " . $e->getMessage());
        throw new Exception("Erro ao salvar dados: " . $e->getMessage());
    }
}


function buscarDados(): array
{
    global $pdo;
    try
    {
        $sql = "
            SELECT `key`, `value`, `timestamp` 
            FROM dados 
            WHERE `timestamp` = (
                SELECT MAX(`timestamp`) 
                FROM dados AS d2 
                WHERE d2.`key` = dados.`key`
            ) 
            ORDER BY `key` ASC
        ";

        $stmt = $pdo->query($sql);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }
    catch (PDOException $e)
    {
        logMessage("Erro ao buscar dados no banco: " . $e->getMessage());
        throw new Exception("Erro ao buscar dados: " . $e->getMessage());
    }
}

?>