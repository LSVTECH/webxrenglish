# Plan de Corrección - webxrenglish

## Leyenda
- 🔴 Bloqueante
- 🟠 Alto
- 🟡 Medio
- 🟢 Bajo

---

## Fase 1: Error Crítico que Rompe la App

- [ ] **1.1** 🔴 Reparar syntax error en `updateBookingUI` (`index.html:833-835`)
  - Cambiar `    }xt;` por `    }` y eliminar llaves extra.

## Fase 2: Bugs de UX/UI en VR

- [ ] **2.1** 🟠 Separar textos 3D superpuestos (`index.html:380-390`)
  - `roomDetailsText`, `guestNameText`, `nightsText` se solapan entre sí y con el borde decorativo.

## Fase 3: Bugs de Funcionalidad

- [ ] **3.1** 🟠 Limitar crecimiento del `chatHistory` (`index.html:455`)
  - `chatHistory` crece sin límite. Mantener solo últimas 10 interacciones.

- [ ] **3.2** 🟡 Arreglar selección de voz TTS (`index.html:973-982`)
  - `getVoices()` llamado síncronamente antes de que los voices se carguen.

- [ ] **3.3** 🟡 Prevenir estado bloqueado en pulsación rápida (`index.html:636-686`)
  - Flag `recognitionStarted` para evitar que `stopRecording()` se llame antes de que inicie el reconocimiento.

- [ ] **3.4** 🟢 Resetear posición del cubo después de `triggerGoToRoomAnimation` (`index.html:951-962`)
  - El cubo vuela fuera de escena y no vuelve.

## Fase 4: Seguridad y Backend

- [ ] **4.1** 🟠 Validar entrada en API proxy (`api/chat.js:16`)
  - `req.body` se pasa sin validación a Gemini.

- [ ] **4.2** 🟡 Usar `X-Goog-Api-Key` header en vez de query param (`api/chat.js:13`)
  - API Key expuesta en logs del servidor como query param.

- [ ] **4.3** 🟢 Simplificar `vercel.json`
  - Catch-all redundante y falta de manejo SPA 404.

## Fase 5: Calidad de Código

- [ ] **5.1** 🟢 Limpiar variables no usadas (`index.html:443-444`)
  - `STAR_FILLED` y `STAR_EMPTY` ya no se usan.

- [ ] **5.2** 🟢 Mejorar parseo de respuesta Gemini (`index.html:910-917`)
  - Segundo `JSON.parse` sin try-catch propio.

---

## Orden de Ejecución

| Orden | Tarea | Impacto |
|-------|-------|---------|
| 1 | 1.1 | 🔴 |
| 2 | 2.1 | 🟠 |
| 3 | 3.1 | 🟠 |
| 4 | 4.1 | 🟠 |
| 5 | 3.3 | 🟡 |
| 6 | 4.2 | 🟡 |
| 7 | 3.2 | 🟡 |
| 8 | 3.4 | 🟢 |
| 9 | 4.3 | 🟢 |
| 10 | 5.1 | 🟢 |
| 11 | 5.2 | 🟢 |
