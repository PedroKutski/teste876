import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useStore } from '../StoreContext';
import { Database, Copy, Check, Save, AlertCircle, ChevronDown } from 'lucide-react';

const GOOGLE_SCRIPT_CODE = `function doGet(e) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  
  var namesSheet = ss.getSheetByName("Nomes");
  if (!namesSheet) {
    namesSheet = ss.insertSheet("Nomes");
    namesSheet.appendRow(["Nome"]);
  }
  
  var modelsSheet = ss.getSheetByName("Modelos");
  if (!modelsSheet) {
    modelsSheet = ss.insertSheet("Modelos");
    modelsSheet.appendRow(["Modelo"]);
  }

  var withdrawalsSheet = ss.getSheetByName("Retiradas");
  if (!withdrawalsSheet) {
    withdrawalsSheet = ss.insertSheet("Retiradas");
    withdrawalsSheet.appendRow(["Data", "Código", "Código Próprio", "Nome", "Itens Retirados"]);
  }
  
  var names = [];
  if (namesSheet.getLastRow() > 1) {
    names = namesSheet.getRange(2, 1, namesSheet.getLastRow() - 1, 1).getValues().map(function(r) { return r[0]; });
  }
  
  var models = [];
  if (modelsSheet.getLastRow() > 1) {
    models = modelsSheet.getRange(2, 1, modelsSheet.getLastRow() - 1, 1).getValues().map(function(r) { return r[0]; });
  }

  var withdrawals = [];
  if (withdrawalsSheet.getLastRow() > 1) {
    var data = withdrawalsSheet.getRange(2, 1, withdrawalsSheet.getLastRow() - 1, 5).getValues();
    withdrawals = data.map(function(row) {
      // Parse items string back to array
      var itemsStr = row[4] || "";
      var items = itemsStr.split(", ").map(function(itemStr) {
        var parts = itemStr.split("x ");
        return {
          quantity: parseInt(parts[0]) || 1,
          model: parts[1] || ""
        };
      }).filter(function(i) { return i.model !== ""; });

      return {
        id: row[1], // Using code as ID for simplicity in sync
        date: row[0],
        code: row[1],
        customCode: row[2] || undefined,
        personName: row[3],
        items: items,
        synced: true
      };
    });
  }
  
  return ContentService.createTextOutput(JSON.stringify({
    names: names.filter(String),
    models: models.filter(String),
    withdrawals: withdrawals.reverse() // Send newest first
  })).setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    
    if (data.action === 'addWithdrawal') {
      var sheet = ss.getSheetByName("Retiradas");
      if (!sheet) {
        sheet = ss.insertSheet("Retiradas");
        sheet.appendRow(["Data", "Código", "Código Próprio", "Nome", "Itens Retirados"]);
      }
      
      var itemsStr = "";
      if (data.items && Array.isArray(data.items)) {
        itemsStr = data.items.map(function(item) {
          return item.quantity + "x " + item.model;
        }).join(", ");
      }
      
      sheet.appendRow([
        data.date,
        data.code,
        data.customCode || "",
        data.personName,
        itemsStr
      ]);
      
      saveToSheet(ss, "Nomes", data.personName);
      if (data.items && Array.isArray(data.items)) {
        data.items.forEach(function(item) {
          saveToSheet(ss, "Modelos", item.model);
        });
      }
      
    } else if (data.action === 'addName') {
      saveToSheet(ss, "Nomes", data.name);
    } else if (data.action === 'addModel') {
      saveToSheet(ss, "Modelos", data.model);
    } else if (data.action === 'removeName') {
      removeFromSheet(ss, "Nomes", data.name);
    } else if (data.action === 'removeModel') {
      removeFromSheet(ss, "Modelos", data.model);
    } else if (data.action === 'removeWithdrawal') {
      var sheet = ss.getSheetByName("Retiradas");
      if (sheet && sheet.getLastRow() > 1) {
        var values = sheet.getRange(2, 2, sheet.getLastRow() - 1, 1).getValues();
        for (var i = 0; i < values.length; i++) {
          if (values[i][0] === data.code) {
            sheet.deleteRow(i + 2);
            break;
          }
        }
      }
    }
    
    return ContentService.createTextOutput(JSON.stringify({ "status": "success" }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch(error) {
    return ContentService.createTextOutput(JSON.stringify({ "status": "error", "message": error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function saveToSheet(ss, sheetName, value) {
  if (!value) return;
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
    sheet.appendRow([sheetName === "Nomes" ? "Nome" : "Modelo"]);
  }
  var values = [];
  if (sheet.getLastRow() > 1) {
    values = sheet.getRange(2, 1, sheet.getLastRow() - 1, 1).getValues().map(function(r) { return r[0]; });
  }
  if (values.indexOf(value) === -1) {
    sheet.appendRow([value]);
  }
}

function removeFromSheet(ss, sheetName, value) {
  if (!value) return;
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet) return;
  
  if (sheet.getLastRow() > 1) {
    var values = sheet.getRange(2, 1, sheet.getLastRow() - 1, 1).getValues();
    for (var i = 0; i < values.length; i++) {
      if (values[i][0] === value) {
        sheet.deleteRow(i + 2);
        break;
      }
    }
  }
}`;

export function Settings() {
  const { scriptUrl, setScriptUrl } = useStore();
  const [urlInput, setUrlInput] = useState(scriptUrl);
  const [saved, setSaved] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showSetup, setShowSetup] = useState(false);

  const handleSave = () => {
    setScriptUrl(urlInput);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(GOOGLE_SCRIPT_CODE);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="max-w-md mx-auto space-y-6 pb-24"
    >
      <div className="bg-white p-5 rounded-[28px] shadow-sm">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-2xl">
            <Database size={24} />
          </div>
          <div>
            <h2 className="text-[17px] font-semibold text-gray-900">Banco de Dados</h2>
            <p className="text-[13px] text-gray-500">Conexão com Google Sheets</p>
          </div>
        </div>
        
        <div className="space-y-3">
          <label className="block text-[13px] font-medium text-gray-500 ml-1">
            URL do Web App (Google Apps Script)
          </label>
          <input
            type="url"
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            placeholder="https://script.google.com/macros/s/.../exec"
            className="w-full px-4 py-3.5 text-[16px] rounded-2xl bg-gray-100/80 focus:bg-gray-200/80 outline-none transition-colors"
          />
          <button
            onClick={handleSave}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white text-[16px] font-semibold py-3.5 rounded-2xl transition-all active:scale-[0.98] flex items-center justify-center gap-2"
          >
            {saved ? <Check size={20} /> : <Save size={20} />}
            {saved ? 'Salvo!' : 'Salvar Configuração'}
          </button>
        </div>
      </div>

      <div className="bg-white rounded-[28px] shadow-sm overflow-hidden">
        <button
          onClick={() => setShowSetup(!showSetup)}
          className="w-full p-5 flex items-center justify-between text-left active:bg-gray-50 transition-colors"
        >
          <div>
            <h3 className="text-[16px] font-semibold text-gray-900">Como configurar</h3>
            <p className="text-[13px] text-gray-500 mt-0.5">Instruções e código do script</p>
          </div>
          <motion.div
            animate={{ rotate: showSetup ? 180 : 0 }}
            transition={{ duration: 0.2 }}
            className="p-2 bg-gray-100 rounded-full text-gray-500"
          >
            <ChevronDown size={20} />
          </motion.div>
        </button>

        <AnimatePresence>
          {showSetup && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="p-5 pt-0 border-t border-gray-100">
                <div className="flex items-center justify-between mb-4 mt-4">
                  <span className="text-[14px] font-medium text-gray-700">Código do Script</span>
                  <button
                    onClick={handleCopy}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 rounded-xl text-[13px] font-medium transition-colors active:scale-95"
                  >
                    {copied ? <Check size={16} /> : <Copy size={16} />}
                    {copied ? 'Copiado!' : 'Copiar Código'}
                  </button>
                </div>

                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex gap-3 mb-5">
                  <AlertCircle className="text-amber-600 shrink-0 mt-0.5" size={20} />
                  <p className="text-[13px] text-amber-800 leading-relaxed">
                    Crie uma planilha, vá em <strong>Extensões &gt; Apps Script</strong>, cole o código copiado e implante como <strong>App da Web</strong> (Acesso: Qualquer pessoa).
                  </p>
                </div>

                <div className="relative max-h-[200px] overflow-y-auto rounded-2xl bg-gray-900 border border-gray-800">
                  <pre className="p-4 text-[11px] font-mono text-gray-300 leading-relaxed">
                    <code>{GOOGLE_SCRIPT_CODE}</code>
                  </pre>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
