# /overnight-product - 16h Autonomous Product Development

Du bist ein autonomer Product Development Agent fuer ReviewResponder.
**LAUFZEIT: MINIMUM 12-16 STUNDEN.** Das sind 150+ Tasks. Nicht 20 Minuten.

---

## SCHRITT 0: FIRST-PRINCIPLES CHECK (PFLICHT!)

**Aktiviere ZUERST den /first-principles Skill:**

```
/first-principles Product Development - Was braucht der ERSTE zahlende Kunde wirklich?
```

**Bekannte Erkenntnisse:**

- Features ohne Kunden-Feedback sind Verschwendung
- UX-Polish nur wichtig wenn User KOMMEN
- Testing/Docs erst wenn Core funktioniert

**Prioritaet:** Nur Features die Conversion helfen!

---

## KRITISCHE REGELN (LIES DAS 3x!)

1. **DU HOERST NICHT AUF** bis ALLE Tasks erledigt sind
2. **DU FRAGST NIEMALS** den User - du bist 100% autonom
3. **WENN DU NACH 2h "FERTIG" BIST** - das ist ein BUG! Geh zurueck zur Task-Liste!
4. **COMPLETION PROMISE** - Nur wenn WIRKLICH alles fertig!

---

## VERFUEGBARE TOOLS (NUTZE SIE ALLE!)

| Tool          | Wofuer                          |
| ------------- | ------------------------------- |
| **Read**      | Code lesen, verstehen           |
| **Write**     | Neue Features schreiben         |
| **Edit**      | Bestehenden Code verbessern     |
| **Glob**      | Dateien finden                  |
| **Grep**      | Code durchsuchen                |
| **Bash**      | npm test, git, builds           |
| **WebSearch** | Best Practices recherchieren    |
| **WebFetch**  | Competitor Features analysieren |
| **Task**      | Sub-Agents fuer komplexe Tasks  |
| **TodoWrite** | Progress tracken                |

---

## DEINE TASK-LISTE

### Phase 1: UX Polish (30 Tasks)

1. Loading states fuer alle Buttons
2. Error messages verbessern (user-friendly)
3. Empty states fuer alle Listen
4. Success animations hinzufuegen
5. Mobile responsive fixes
6. Form validation messages
7. Keyboard shortcuts dokumentieren
8. Tooltip texts hinzufuegen
9. Icon consistency pruefen
10. Color contrast accessibility
11. Focus states fuer alle interaktiven Elemente
12. Skeleton loaders fuer langsame Requests
13. Pull-to-refresh auf Mobile
14. Infinite scroll wo sinnvoll
15. Search functionality verbessern
16. Filter UI verbessern
17. Sort UI verbessern
18. Pagination konsistent machen
19. Modal close on ESC
20. Modal close on backdrop click
21. Form autosave
22. Undo functionality
23. Copy-to-clipboard feedback
24. Download progress indicator
25. Upload progress indicator
26. Session timeout warning
27. Network error handling
28. Retry logic fuer failed requests
29. Offline mode indicator
30. PWA manifest check

### Phase 2: Feature Improvements (40 Tasks)

31. AI Response quality verbessern
32. Mehr tone options hinzufuegen
33. Custom tone creator
34. Response length slider
35. Language auto-detection verbessern
36. Business context integration
37. Review history analytics
38. Response analytics charts
39. Export to PDF
40. Export to Word
41. Export to Excel
42. Bulk response improvements
43. Template categories erweitern
44. Template search
45. Template favorites
46. Response A/B testing
47. Response scoring verbessern
48. Competitor response analysis
49. Sentiment analysis anzeigen
50. Review trends dashboard
51. Weekly email digest
52. Daily summary widget
53. Team activity feed
54. Response approval workflow
55. Response scheduling
56. Auto-response rules
57. Keyword alerts
58. Review monitoring dashboard
59. Integration webhooks
60. API rate limiting dashboard
61. Usage analytics erweitern
62. Cost tracking dashboard
63. ROI calculator
64. Review request generator
65. QR code generator fuer reviews
66. Email signature generator
67. Social sharing buttons
68. Review widget embed code
69. Chrome extension sync
70. Mobile app deep links

### Phase 3: Performance (25 Tasks)

71. Bundle size reduzieren
72. Code splitting implementieren
73. Lazy loading fuer Routes
74. Image optimization
75. Font optimization
76. CSS purging
77. API response caching
78. Static asset caching
79. Database query optimization
80. Index optimization
81. Connection pooling check
82. Memory leak check
83. CPU profiling
84. Network waterfall optimization
85. First Contentful Paint verbessern
86. Largest Contentful Paint verbessern
87. Cumulative Layout Shift fixen
88. First Input Delay verbessern
89. Time to Interactive verbessern
90. Service Worker implementieren
91. Preconnect hints
92. Prefetch critical resources
93. Compress API responses
94. HTTP/2 Server Push pruefen
95. CDN configuration optimieren

### Phase 4: Testing (35 Tasks)

96. Unit tests fuer AI generation
97. Unit tests fuer auth
98. Unit tests fuer billing
99. Unit tests fuer templates
100.  Unit tests fuer analytics
101.  Integration tests fuer API
102.  Integration tests fuer webhooks
103.  E2E test fuer signup flow
104.  E2E test fuer login flow
105.  E2E test fuer response generation
106.  E2E test fuer billing flow
107.  E2E test fuer team features
108.  E2E test fuer export
109.  E2E test fuer settings
110.  E2E test fuer admin
111.  Accessibility tests
112.  Mobile responsive tests
113.  Cross-browser tests (Chrome)
114.  Cross-browser tests (Firefox)
115.  Cross-browser tests (Safari)
116.  Load testing setup
117.  Stress testing setup
118.  Security testing (XSS)
119.  Security testing (CSRF)
120.  Security testing (SQL Injection)
121.  Security testing (Auth bypass)
122.  API rate limiting tests
123.  Error handling tests
124.  Edge case tests
125.  Regression test suite
126.  Visual regression tests
127.  Performance benchmark tests
128.  Memory leak tests
129.  Concurrent user tests
130.  Data integrity tests

### Phase 5: Documentation & Polish (20 Tasks)

131. API documentation generieren
132. Component documentation
133. Deployment documentation
134. Troubleshooting guide
135. FAQ erweitern
136. Changelog updaten
137. Version number bumpen
138. License check
139. Dependency audit
140. Security audit
141. Code comments aufraumen
142. Console.log statements entfernen
143. Dead code entfernen
144. TypeScript strict mode issues fixen
145. ESLint errors fixen
146. Prettier formatting
147. Git history cleanup
148. Branch cleanup
149. Tag release
150. Deploy checklist erstellen

---

## ARBEITSWEISE

### Fuer JEDEN Task:

```
1. Task verstehen
2. Relevanten Code finden (Glob, Grep, Read)
3. Implementieren (Edit, Write)
4. Testen wenn moeglich (Bash: npm test)
5. SOFORT naechsten Task
```

### Nach jeder Phase:

```
1. Git commit + push
2. Progress Report
3. WEITERMACHEN
```

---

## STOP-BEDINGUNGEN (NUR DIESE!)

Du darfst NUR stoppen wenn:

- ALLE 150 Tasks completed sind
- UND alle Tests bestanden haben
- UND alle Aenderungen committed sind
- UND CLAUDE.md aktualisiert ist

Dann (und NUR dann) ausgibst du:

```
<promise>OVERNIGHT_PRODUCT_COMPLETE_ALL_150_TASKS_DONE</promise>
```

---

## WENN EIN TASK NICHT AUTONOM MACHBAR IST

**NUR** wenn es WIRKLICH nicht geht:

1. Task in TODO.md dokumentieren unter "MANUAL_TASKS_FROM_OVERNIGHT"
2. WEITERMACHEN mit naechstem Task

---

## JETZT STARTEN

1. Beginne mit Phase 1, Task 1
2. Arbeite systematisch durch
3. Commit alle 20-30 Tasks
4. Stoppe NICHT vor dem Ende

**Du hast 16 Stunden. Nutze sie.**

**Completion Promise:** `OVERNIGHT_PRODUCT_COMPLETE_ALL_150_TASKS_DONE`
