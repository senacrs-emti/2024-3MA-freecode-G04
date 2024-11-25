const maxColumns: number = 8;
const previousData: Record<string, string[]> = {};

interface Row
{
    key: string;
    timestamp: number;
    value: string;
}

function fetchDataAndUpdateTable(): void
{
    fetch('api.php')
        .then((response: Response) => response.json())
        .then((data: Row[]) =>
        {
            const tbody: HTMLTableSectionElement = document.getElementById('data-table') as HTMLTableSectionElement;

            data.forEach((row: Row) =>
            {
                const valores: string[] = row.value.split(',');
                const paddedValores: string[] = [...valores, ...Array(maxColumns - valores.length).fill('')];

                let existingRow: HTMLTableRowElement | null = document.querySelector(`tr[data-key="${row.key}"]`);

                if (!existingRow)
                {
                    const tr: HTMLTableRowElement = document.createElement('tr');
                    tr.setAttribute('data-key', row.key);

                    let rowContent: string = `<td class="timestamp">${new Date(row.timestamp * 1000).toISOString().slice(11, 19)}</td>`;
                    rowContent += `<td>${row.key}</td>`;
                    paddedValores.forEach((val: string) => {
                        rowContent += `<td>${val || ''}</td>`;
                    });
                    tr.innerHTML = rowContent;
                    tbody.appendChild(tr);
                }
                else
                {
                    const cells: NodeListOf<HTMLTableCellElement> = existingRow.querySelectorAll('td');
                    cells[0].textContent = new Date(row.timestamp * 1000).toISOString().slice(11, 19);

                    paddedValores.forEach((val: string, index: number) => {
                        const cellIndex: number = index + 2;
                        if (cells[cellIndex].textContent !== val)
                        {
                            cells[cellIndex].textContent = val;
                            cells[cellIndex].classList.add('highlight');
                            setTimeout(() => cells[cellIndex].classList.remove('highlight'), 1000);
                        }
                    });
                }

                previousData[row.key] = paddedValores;
            });
        })
        .catch((error: Error) => console.error('Erro ao buscar dados:', error));
}

setInterval(fetchDataAndUpdateTable, 1000);
