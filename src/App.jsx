import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import { Upload, Search, Key, MapPin } from 'lucide-react';
import './App.css';

// Helper function to decode HTML entities like &#237; and &#225;
const decodeHTML = (html) => {
  const txt = document.createElement('textarea');
  txt.innerHTML = html;
  return txt.value;
};

function App() {
  const [data, setData] = useState([]);
  const [fileName, setFileName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: 'chave', direction: 'asc' });

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setFileName(file.name);

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const content = evt.target.result;
        // The file could be an HTML file explicitly renamed to .xls, or a real Excel binary.
        // XLSX can parse HTML tables directly into workbooks!
        const workbook = XLSX.read(content, { type: 'binary', raw: true });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        
        // Convert to JSON
        const jsonData = XLSX.utils.sheet_to_json(sheet, { defval: "" });

        // Process data
        const processedData = jsonData
          .map(row => {
            // Adjust casing matching from the file format:
            const identificadorRaw = row['IdentificadorChave'] || row['IdenticadorChave'] || '';
            const identificador = String(identificadorRaw).trim();
            
            // Format and decode address
            const endereco = decodeHTML(String(row['Endereco'] || '').trim());
            const numero = decodeHTML(String(row['EnderecoNumero'] || '').trim());
            const complemento = decodeHTML(String(row['Complemento'] || '').trim());
            const bloco = decodeHTML(String(row['Bloco'] || '').trim());
            
            const partesEndereco = [endereco, numero, complemento, bloco].filter(p => p !== '' && p !== '-');
            const enderecoFormatado = partesEndereco.join(', ').replace(/\s+/g, ' ').trim();

            let placa = decodeHTML(String(row['Placa'] || '').trim());
            if (placa === '') placa = 'Sem placa';

            return {
              codigo: decodeHTML(String(row['Codigo'] || '').trim()),
              finalidade: decodeHTML(String(row['Finalidade'] || '').trim()),
              situacao: decodeHTML(String(row['Situacao'] || '').trim()),
              placa: placa,
              endereco: enderecoFormatado,
              chave: identificador
            };
          })
          .filter(item => item.chave !== ''); // Ignore records without a key

        setData(processedData);
      } catch (error) {
        console.error("Erro ao processar o arquivo:", error);
        alert("Ocorreu um erro ao processar o arquivo. Verifique se o formato ou a extensão estão corretos.");
      }
    };

    reader.readAsBinaryString(file);
  };

  const requestSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  let items = [...data];
  
  if (searchQuery) {
    const q = searchQuery.toLowerCase();
    items = items.filter(
      (item) =>
        item.codigo.toLowerCase().includes(q) ||
        item.endereco.toLowerCase().includes(q)
    );
  }

  // Sort
  items.sort((a, b) => {
    let valA = a[sortConfig.key];
    let valB = b[sortConfig.key];

    // Attempt numeric sort for keys if applicable
    const isNumA = !isNaN(Number(valA));
    const isNumB = !isNaN(Number(valB));
    
    if (isNumA && isNumB) {
      valA = Number(valA);
      valB = Number(valB);
    } else {
      valA = valA.toString().toLowerCase();
      valB = valB.toString().toLowerCase();
    }

    if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
    if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
    return 0;
  });

  return (
    <div className="container">
      <header className="header">
        <h1><Key className="icon" /> Relatório de Chaves</h1>
        <p className="subtitle">Faça o upload da planilha do sistema imobiliário para visualizar a posição das chaves no quadro.</p>
      </header>

      <main>
        <div className="controls">
          <label className="upload-btn">
            <Upload size={18} style={{ marginRight: '8px' }} />
            {fileName || 'Selecionar Planilha'}
            <input 
              type="file" 
              accept=".xls,.xlsx,.csv" 
              onChange={handleFileUpload} 
              style={{ display: 'none' }}
            />
          </label>

          {data.length > 0 && (
            <div className="search-bar">
              <Search size={18} className="search-icon" />
              <input 
                type="text" 
                placeholder="Buscar por Código ou Endereço..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          )}
        </div>

        {data.length > 0 ? (
          <div className="table-responsive">
            <table className="keys-table">
              <thead>
                <tr>
                  <th onClick={() => requestSort('codigo')} style={{ cursor: 'pointer' }}>
                    Código {sortConfig.key === 'codigo' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : ''}
                  </th>
                  <th onClick={() => requestSort('finalidade')} style={{ cursor: 'pointer' }}>
                    Finalidade {sortConfig.key === 'finalidade' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : ''}
                  </th>
                  <th onClick={() => requestSort('situacao')} style={{ cursor: 'pointer' }}>
                    Situação {sortConfig.key === 'situacao' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : ''}
                  </th>
                  <th onClick={() => requestSort('placa')} style={{ cursor: 'pointer' }}>
                    Placa {sortConfig.key === 'placa' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : ''}
                  </th>
                  <th onClick={() => requestSort('endereco')} style={{ cursor: 'pointer' }}>
                    Endereço do Imóvel {sortConfig.key === 'endereco' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : ''}
                  </th>
                  <th onClick={() => requestSort('chave')} style={{ cursor: 'pointer', backgroundColor: '#e2e8f0' }}>
                    Posição no Quadro {sortConfig.key === 'chave' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : ''}
                  </th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, index) => (
                  <tr key={index}>
                    <td><strong>{item.codigo}</strong></td>
                    <td>{item.finalidade}</td>
                    <td><span className="badge">{item.situacao}</span></td>
                    <td>{item.placa}</td>
                    <td className="endereco-cell">
                      <MapPin size={14} style={{ marginRight: '5px', color: '#64748b', verticalAlign: 'middle' }} />
                      {item.endereco}
                    </td>
                    <td className="chave-cell">
                      <strong>{item.chave}</strong>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty-state">
            Nenhuma planilha enviada ou chaves selecionadas.
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
