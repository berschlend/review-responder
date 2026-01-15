# LinkedIn Outreach Tracking Sheet Template

> **Google Sheets Link:** Create your own copy by importing the CSV template below

---

## QUICK SETUP

### Option 1: Import CSV Template

1. Go to [Google Sheets](https://sheets.google.com)
2. Create new spreadsheet
3. File > Import > Upload
4. Select `tracking-template.csv` from this folder
5. Import as "Replace current sheet"

### Option 2: Copy Template Manually

Use the structure below to create your own sheet.

---

## SHEET STRUCTURE

### Sheet 1: "Prospects" (Main Tracking)

| Column | Header              | Description           | Data Validation |
| ------ | ------------------- | --------------------- | --------------- |
| A      | Name                | Prospect's full name  | Text            |
| B      | Title               | Job title             | Text            |
| C      | Company             | Company name          | Text            |
| D      | Industry            | Business type         | Dropdown        |
| E      | Location            | City/Country          | Text            |
| F      | Profile URL         | LinkedIn profile link | URL             |
| G      | Status              | Outreach status       | Dropdown        |
| H      | Connection Sent     | Date sent             | Date            |
| I      | Connection Accepted | Date accepted         | Date            |
| J      | Follow-up 1 Sent    | First follow-up date  | Date            |
| K      | Follow-up 2 Sent    | Second follow-up date | Date            |
| L      | Response            | Their response        | Text            |
| M      | Demo Booked         | Demo date             | Date            |
| N      | Converted           | Became customer?      | Checkbox        |
| O      | Plan                | Which plan            | Dropdown        |
| P      | Notes               | Additional notes      | Text            |

### Status Dropdown Options:

- `pending` - Not yet contacted
- `connection_sent` - Connection request sent
- `connected` - Connection accepted
- `follow_up_1` - First follow-up sent
- `follow_up_2` - Second follow-up sent
- `responded` - Prospect replied
- `demo_scheduled` - Demo booked
- `converted` - Became customer
- `not_interested` - Declined
- `no_response` - No reply after follow-ups

### Industry Dropdown Options:

- Restaurant
- Hotel
- Dental
- Medical
- Legal
- Auto Service
- Salon/Spa
- Fitness
- Real Estate
- Marketing Agency
- Franchise
- Other

### Plan Dropdown Options:

- Free
- Starter ($29)
- Professional ($49)
- Unlimited ($99)

---

## SHEET 2: "Weekly Stats" (Dashboard)

| Metric                   | Week 1 | Week 2 | Week 3 | Week 4 | MTD       |
| ------------------------ | ------ | ------ | ------ | ------ | --------- |
| Connection Requests Sent |        |        |        |        | =SUM(B:E) |
| Connections Accepted     |        |        |        |        |           |
| Accept Rate              |        |        |        |        |           |
| Follow-ups Sent          |        |        |        |        |           |
| Responses Received       |        |        |        |        |           |
| Response Rate            |        |        |        |        |           |
| Demos Booked             |        |        |        |        |           |
| Conversions              |        |        |        |        |           |
| Revenue                  |        |        |        |        |           |

### Formulas to Use:

**Accept Rate:**

```
=IF(B2>0, B3/B2, 0)
```

**Response Rate:**

```
=IF(B4>0, B5/B4, 0)
```

**Conversion Rate:**

```
=IF(B6>0, B8/B6, 0)
```

---

## SHEET 3: "Message Templates" (Quick Reference)

| #   | Type       | Template Name   | Message                                      |
| --- | ---------- | --------------- | -------------------------------------------- |
| 1   | Connection | Direct Value    | Hi {name}, I noticed you manage {company}... |
| 2   | Connection | Pain Point      | Hi {name}! Managing {industry} reviews...    |
| 3   | Connection | Curiosity       | Hey {name}, quick question...                |
| 4   | Follow-up  | Immediate Value | Thanks for connecting, {name}!...            |
| 5   | Follow-up  | Free Trial      | Hi {name}! 5 FREE review responses...        |

---

## CONDITIONAL FORMATTING RULES

### Status Column (G):

| Status          | Color                 |
| --------------- | --------------------- |
| pending         | Gray (#E0E0E0)        |
| connection_sent | Light Blue (#B3E5FC)  |
| connected       | Light Green (#C8E6C9) |
| follow_up_1     | Yellow (#FFF9C4)      |
| follow_up_2     | Orange (#FFE0B2)      |
| responded       | Green (#A5D6A7)       |
| demo_scheduled  | Purple (#E1BEE7)      |
| converted       | Dark Green (#81C784)  |
| not_interested  | Red (#FFCDD2)         |
| no_response     | Gray (#BDBDBD)        |

### Overdue Follow-ups:

Highlight row red if:

- Status is `connected` AND
- Connection Accepted date > 3 days ago AND
- Follow-up 1 Sent is empty

Formula:

```
=AND($G2="connected", TODAY()-$I2>3, $J2="")
```

---

## AUTOMATION SUGGESTIONS

### Google Apps Script - Auto Reminders:

```javascript
function checkFollowUps() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Prospects');
  const data = sheet.getDataRange().getValues();
  const today = new Date();

  const overdue = [];

  for (let i = 1; i < data.length; i++) {
    const status = data[i][6]; // Column G
    const connectedDate = data[i][8]; // Column I
    const followUp1 = data[i][9]; // Column J

    if (status === 'connected' && connectedDate && !followUp1) {
      const daysSince = Math.floor((today - connectedDate) / (1000 * 60 * 60 * 24));
      if (daysSince > 1) {
        overdue.push({
          name: data[i][0],
          company: data[i][2],
          daysSince: daysSince,
        });
      }
    }
  }

  if (overdue.length > 0) {
    const message =
      `You have ${overdue.length} prospects waiting for follow-up:\n\n` +
      overdue.map(p => `- ${p.name} (${p.company}) - ${p.daysSince} days`).join('\n');

    MailApp.sendEmail({
      to: Session.getActiveUser().getEmail(),
      subject: 'LinkedIn Outreach: Follow-ups Needed',
      body: message,
    });
  }
}

// Run daily
function createTrigger() {
  ScriptApp.newTrigger('checkFollowUps').timeBased().everyDays(1).atHour(9).create();
}
```

---

## FILTERS & VIEWS

### Useful Filter Views:

**1. Needs Follow-up:**

- Status = "connected"
- Follow-up 1 Sent = (empty)

**2. Hot Leads:**

- Status = "responded" OR "demo_scheduled"

**3. This Week's Outreach:**

- Connection Sent >= (start of week)

**4. By Industry:**

- Filter by specific industry

**5. Converted Customers:**

- Converted = TRUE

---

## METRICS TO TRACK

### Weekly KPIs:

| Metric              | Target | Formula                  |
| ------------------- | ------ | ------------------------ |
| Connection Requests | 100    | COUNT(status != pending) |
| Accept Rate         | 25%+   | Connected / Requests     |
| Response Rate       | 20%+   | Responded / Follow-ups   |
| Demo Rate           | 10%+   | Demos / Responses        |
| Conversion Rate     | 30%+   | Converted / Demos        |

### Monthly Goals:

- 400 connection requests
- 100 new connections (25%)
- 20 conversations (20%)
- 8 demos (40%)
- 3-5 customers (40%)

### Revenue Tracking:

```
= SUMIF(Converted, TRUE, Plan_Revenue)
```

Where Plan_Revenue lookup:

- Starter = $29
- Professional = $49
- Unlimited = $99

---

## BEST PRACTICES

1. **Update immediately** - Log actions right after you do them
2. **Set reminders** - Use conditional formatting for overdue follow-ups
3. **Review weekly** - Check stats every Friday
4. **Clean monthly** - Archive no-response after 2 weeks
5. **Learn from data** - Which messages get best response?

---

_Template Version: 1.0 | Last Updated: January 10, 2026_
