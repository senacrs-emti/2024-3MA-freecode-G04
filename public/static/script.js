const maxColumns = 8;
const previousData = {};

function fetchDataAndUpdateTable()
{
    fetch('https://arthurfetzner.com/api.php')
        .then(response => {
            if (!response.ok)
                throw new Error('Erro na resposta da API: ' + response.statusText);
    
            return response.json();
        })
        .then(data => {
            const tbody = document.getElementById('data-table');

            data.forEach(row => {
                const valores = row.value.split(',');
                const paddedValores = valores.concat(Array(maxColumns - valores.length).fill(''));

                let existingRow = document.querySelector('tr[data-key="' + row.key + '"]');

                if (!existingRow)
                {
                    const tr = document.createElement('tr');
                    tr.setAttribute('data-key', row.key);

                    let rowContent = '<td class="timestamp">' + new Date(row.timestamp * 1000).toISOString().slice(11, 19) + '</td>';
                    rowContent += '<td>' + row.key + '</td>';
                    paddedValores.forEach(function(val) {
                        rowContent += '<td>' + (val || '') + '</td>';
                    });
                    tr.innerHTML = rowContent;
                    tbody.appendChild(tr);
                }
                else
                {
                    const cells = existingRow.querySelectorAll('td');
                    cells[0].textContent = new Date(row.timestamp * 1000).toISOString().slice(11, 19);

                    paddedValores.forEach(function(val, index) {
                        const cellIndex = index + 2;
                        if (cells[cellIndex].textContent !== val)
                        {
                            cells[cellIndex].textContent = val;
                            cells[cellIndex].classList.add('highlight');
                            setTimeout(function() {
                                cells[cellIndex].classList.remove('highlight');
                            }, 1000);
                        }
                    });
                }

                previousData[row.key] = paddedValores;
            });
        })
        .catch(error => {
            console.error('Erro ao buscar dados:', error);
            alert('Ocorreu um erro ao buscar os dados da API: ' + error.message);
        });
}

setInterval(fetchDataAndUpdateTable, 1000);
