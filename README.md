# solo-6600019: 地震波形 P/S 波自动拾取分析

## 技术栈
- Frontend: Vue 3 + TypeScript + Vite + Pinia + Tailwind CSS + ECharts
- Backend: Python FastAPI + NumPy/SciPy + ObsPy (production)

## 核心特性
1. **三轴波形实时绘制**：BHZ/BHN/BHE 三通道地震波形 ECharts 渲染
2. **STA/LTA 自动拾取**：Short-Term Average / Long-Term Average 算法自动识别 P 波/S 波到时
3. **参数调节**：STA 窗口、LTA 窗口、触发阈值实时调节
4. **台站管理**：台站列表查看，经纬度坐标展示
5. **事件目录**：地震事件震级/深度/位置信息管理
6. **SAC/miniSEED 上传**：支持专业地震数据格式文件上传解析

## 启动
```bash
# Frontend
cd frontend && npm install && npm run dev

# Backend
cd backend && pip install -r requirements.txt && uvicorn app.main:app --reload --port 8001
```
