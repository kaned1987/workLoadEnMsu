import React, { useState } from 'react';
import { X, CheckCircle2, AlertCircle, Link2, Database, Copy, Check, ExternalLink, RefreshCw } from 'lucide-react';
import { getActiveAppsScriptUrl, setActiveAppsScriptUrl, testAppsScriptConnection } from '../services/appsScriptService';
import { SheetMetadata, DataMappingField } from '../types';

interface ConnectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRefreshData: () => void;
  metadata?: SheetMetadata | null;
  mappingFields?: DataMappingField[];
}

export const ConnectionModal: React.FC<ConnectionModalProps> = ({
  isOpen,
  onClose,
  onRefreshData,
  metadata,
  mappingFields = [],
}) => {
  const [urlInput, setUrlInput] = useState<string>(getActiveAppsScriptUrl());
  const [testState, setTestState] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [testMessage, setTestMessage] = useState<string>('');
  const [copiedScript, setCopiedScript] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'settings' | 'mapping' | 'instructions'>('settings');

  if (!isOpen) return null;

  const handleSave = () => {
    setActiveAppsScriptUrl(urlInput);
    onRefreshData();
    onClose();
  };

  const handleTest = async () => {
    if (!urlInput.trim()) {
      setTestState('error');
      setTestMessage('กรุณาระบุ URL ของ Google Apps Script');
      return;
    }

    setTestState('testing');
    setTestMessage('กำลังทดสอบการเชื่อมต่อ...');

    const res = await testAppsScriptConnection(urlInput);
    if (res.success) {
      setTestState('success');
      setTestMessage(res.message + (res.spreadsheetName ? ` (${res.spreadsheetName})` : ''));
    } else {
      setTestState('error');
      setTestMessage(res.message);
    }
  };

  const handleCopyCode = () => {
    const code = `// Google Apps Script for ENMSU_CoruseDatabase
function doGet(e) {
  var action = (e && e.parameter && e.parameter.action) || "getAllData";
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet() || SpreadsheetApp.openById("ENMSU_CoruseDatabase_ID");
    if (action === "ping") {
      return ContentService.createTextOutput(JSON.stringify({ success: true, message: "Connected to " + ss.getName() })).setMimeType(ContentService.MimeType.JSON);
    }
    var sheet = ss.getSheets()[0];
    var data = sheet.getDataRange().getValues();
    var headers = data[0];
    var rows = [];
    for (var i = 1; i < data.length; i++) {
      var row = {};
      for (var j = 0; j < headers.length; j++) { row[headers[j]] = data[i][j]; }
      rows.push(row);
    }
    return ContentService.createTextOutput(JSON.stringify({
      success: true,
      metadata: { spreadsheetName: ss.getName(), totalRows: rows.length, headers: headers },
      rows: rows
    })).setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ success: false, error: err.toString() })).setMimeType(ContentService.MimeType.JSON);
  }
}`;
    navigator.clipboard.writeText(code);
    setCopiedScript(true);
    setTimeout(() => setCopiedScript(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#fdf2f2] text-[#800000] flex items-center justify-center border border-[#f3d1d1]">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                การเชื่อมต่อ Google Sheets (ENMSU_CoruseDatabase)
              </h3>
              <p className="text-xs text-slate-500">
                จัดการและตรวจสอบการเชื่อมต่อผ่าน Google Apps Script
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Buttons */}
        <div className="flex border-b border-slate-200 px-6 bg-white gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('settings')}
            className={`py-3 px-3 text-xs font-semibold border-b-2 transition-colors cursor-pointer ${
              activeTab === 'settings'
                ? 'border-[#800000] text-[#800000]'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            ตั้งค่า URL ปลายทาง
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('mapping')}
            className={`py-3 px-3 text-xs font-semibold border-b-2 transition-colors cursor-pointer ${
              activeTab === 'mapping'
                ? 'border-[#800000] text-[#800000]'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            ตารางจับคู่คอลัมน์ (Data Mapping)
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('instructions')}
            className={`py-3 px-3 text-xs font-semibold border-b-2 transition-colors cursor-pointer ${
              activeTab === 'instructions'
                ? 'border-[#800000] text-[#800000]'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            วิธีติดตั้ง Apps Script
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {activeTab === 'settings' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Google Apps Script Web App URL (Exec URL)
                </label>
                <div className="relative">
                  <input
                    type="url"
                    value={urlInput}
                    onChange={(e) => setUrlInput(e.target.value)}
                    placeholder="https://script.google.com/macros/s/AKfycb.../exec"
                    className="w-full h-11 pl-3.5 pr-10 text-xs sm:text-sm font-mono bg-slate-50 focus:bg-white text-slate-900 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#800000]/20 focus:border-[#800000]"
                  />
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-slate-400">
                    <Link2 className="w-4 h-4" />
                  </div>
                </div>
                <p className="text-[11px] text-slate-500 mt-1.5 leading-relaxed">
                  URL ของ Google Apps Script ที่ Deploy เป็น Web App (สิทธิ์เข้าถึง: Anyone) ที่เปิดอ่านไฟล์ <code className="bg-slate-100 px-1 py-0.5 rounded text-slate-800">ENMSU_CoruseDatabase</code>
                </p>
              </div>

              {/* Status Alert */}
              {testState !== 'idle' && (
                <div
                  className={`p-3.5 rounded-xl text-xs flex items-start gap-2.5 ${
                    testState === 'testing'
                      ? 'bg-blue-50 text-blue-800 border border-blue-200'
                      : testState === 'success'
                        ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                        : 'bg-red-50 text-red-800 border border-red-200'
                  }`}
                >
                  {testState === 'testing' && <RefreshCw className="w-4 h-4 animate-spin shrink-0 mt-0.5" />}
                  {testState === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />}
                  {testState === 'error' && <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />}
                  <div>
                    <span className="font-medium">{testMessage}</span>
                  </div>
                </div>
              )}

              {/* Metadata Info */}
              {metadata && (
                <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 space-y-2">
                  <div className="text-xs font-semibold text-slate-800 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>ข้อมูลชีตที่กำลังเชื่อมต่อ: {metadata.spreadsheetName}</span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-[11px] text-slate-600">
                    <div>
                      <span className="text-slate-400">แท็บที่ใช้:</span> <span className="font-medium text-slate-800">{metadata.activeTab}</span>
                    </div>
                    <div>
                      <span className="text-slate-400">จำนวนแถว:</span> <span className="font-medium text-slate-800">{metadata.totalRows} แถว</span>
                    </div>
                    <div>
                      <span className="text-slate-400">จำนวนคอลัมน์:</span> <span className="font-medium text-slate-800">{metadata.headers.length} คอลัมน์</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'mapping' && (
            <div className="space-y-3">
              <p className="text-xs text-slate-600">
                การจับคู่ระหว่างฟิลด์มาตรฐานของระบบกับหัวคอลัมน์จริงใน Google Sheet:
              </p>
              <div className="border border-slate-200 rounded-xl overflow-hidden text-xs">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                    <tr>
                      <th className="py-2.5 px-3">ฟิลด์ในระบบ</th>
                      <th className="py-2.5 px-3">คอลัมน์ใน Google Sheet</th>
                      <th className="py-2.5 px-3 text-center">สถานะ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {mappingFields.map((field) => (
                      <tr key={field.appField} className="hover:bg-slate-50">
                        <td className="py-2 px-3 font-medium">
                          <div>{field.label}</div>
                          <div className="text-[10px] text-slate-400 font-mono">{field.appField}</div>
                        </td>
                        <td className="py-2 px-3 font-mono text-slate-900">
                          {field.sheetColumn || <span className="text-slate-400 italic">ไม่พบคอลัมน์</span>}
                        </td>
                        <td className="py-2 px-3 text-center">
                          {field.status === 'matched' ? (
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                              ตรวจพบ
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-500">
                              ว่าง / ไม่มี
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'instructions' && (
            <div className="space-y-3 text-xs text-slate-700 leading-relaxed">
              <div className="bg-amber-50 border border-amber-200 p-3 rounded-xl text-amber-900">
                <div className="font-semibold mb-1">ขั้นตอนการติดตั้ง Google Apps Script สำหรับ ENMSU_CoruseDatabase:</div>
                <ol className="list-decimal list-inside space-y-1 text-[11px] text-amber-800">
                  <li>เปิดไฟล์ Google Sheet <strong>ENMSU_CoruseDatabase</strong></li>
                  <li>ไปที่เมนู <strong>ส่วนขยาย (Extensions) → Apps Script</strong></li>
                  <li>วางโค้ดจากไฟล์ <code className="bg-amber-100 px-1 py-0.5 rounded">Code.gs</code></li>
                  <li>กด <strong>ทำให้ใช้งานได้ (Deploy) → การทำให้ใช้งานได้ใหม่ (New deployment)</strong></li>
                  <li>เลือกประเภทเป็น <strong>เว็บแอปพลิเคชัน (Web app)</strong></li>
                  <li>ตั้งค่า <em>ผู้มีสิทธิ์เข้าถึง (Who has access)</em> เป็น <strong>ทุกคน (Anyone)</strong></li>
                  <li>คัดลอก Web App URL (ลงท้ายด้วย /exec) มาวางในช่องตั้งค่านี้</li>
                </ol>
              </div>

              <div className="flex items-center justify-between pt-2">
                <span className="font-semibold text-slate-800">สคริปต์ Google Apps Script (Code.gs)</span>
                <button
                  type="button"
                  onClick={handleCopyCode}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 bg-slate-50 hover:bg-slate-100 text-slate-700 font-medium text-xs cursor-pointer"
                >
                  {copiedScript ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedScript ? 'คัดลอกแล้ว' : 'คัดลอกโค้ด Code.gs'}</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50/70 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={handleTest}
            disabled={testState === 'testing'}
            className="px-4 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold cursor-pointer disabled:opacity-50"
          >
            {testState === 'testing' ? 'กำลังทดสอบ...' : 'ทดสอบการเชื่อมต่อ'}
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-200/50 text-xs font-semibold cursor-pointer"
            >
              ยกเลิก
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-5 py-2 rounded-xl bg-[#800000] hover:bg-[#630000] text-white text-xs font-semibold shadow-xs cursor-pointer"
            >
              บันทึกและโหลดข้อมูล
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
