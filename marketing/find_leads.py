"""
ReviewResponder Lead Finder
===========================
Dieses Script hilft dir Businesses zu finden die Review-Hilfe brauchen.

INSTALLATION (einmalig):
    pip install googlesearch-python requests beautifulsoup4

VERWENDUNG:
    python find_leads.py

Das Script sucht nach Businesses und speichert sie in leads.csv
"""

import csv
import os
from datetime import datetime

try:
    from googlesearch import search
    GOOGLE_SEARCH_AVAILABLE = True
except ImportError:
    GOOGLE_SEARCH_AVAILABLE = False
    print("Hinweis: 'googlesearch-python' nicht installiert.")
    print("Installiere mit: pip install googlesearch-python")
    print("")

# Konfiguration
CITIES = [
    "Berlin", "Hamburg", "München", "Köln", "Frankfurt",
    "New York", "Los Angeles", "Chicago", "London", "Toronto"
]

BUSINESS_TYPES = [
    "restaurant", "hotel", "cafe", "bar", "spa",
    "dental clinic", "hair salon", "gym", "auto repair"
]

def manual_lead_entry():
    """Manuelles Hinzufügen von Leads"""
    leads_file = "leads.csv"

    # Erstelle CSV falls nicht existiert
    if not os.path.exists(leads_file):
        with open(leads_file, 'w', newline='', encoding='utf-8') as f:
            writer = csv.writer(f)
            writer.writerow(['Datum', 'Business Name', 'Stadt', 'Typ', 'Email', 'Website', 'Status', 'Notizen'])

    print("\n" + "="*50)
    print("LEAD MANUELL HINZUFÜGEN")
    print("="*50)
    print("(Drücke Enter zum Überspringen)")
    print("")

    business_name = input("Business Name: ").strip()
    if not business_name:
        print("Abgebrochen.")
        return

    city = input("Stadt: ").strip()
    business_type = input("Typ (restaurant/hotel/etc): ").strip()
    email = input("Email: ").strip()
    website = input("Website: ").strip()
    notes = input("Notizen: ").strip()

    # Speichere Lead
    with open(leads_file, 'a', newline='', encoding='utf-8') as f:
        writer = csv.writer(f)
        writer.writerow([
            datetime.now().strftime("%Y-%m-%d"),
            business_name,
            city,
            business_type,
            email,
            website,
            "Neu",
            notes
        ])

    print(f"\n✅ Lead '{business_name}' gespeichert!")

def show_leads():
    """Zeige alle Leads"""
    leads_file = "leads.csv"

    if not os.path.exists(leads_file):
        print("\nNoch keine Leads vorhanden.")
        return

    print("\n" + "="*50)
    print("DEINE LEADS")
    print("="*50)

    with open(leads_file, 'r', encoding='utf-8') as f:
        reader = csv.reader(f)
        headers = next(reader)
        leads = list(reader)

    if not leads:
        print("Noch keine Leads vorhanden.")
        return

    for i, lead in enumerate(leads, 1):
        print(f"\n{i}. {lead[1]} ({lead[2]})")
        print(f"   Typ: {lead[3]} | Email: {lead[4] or 'N/A'}")
        print(f"   Status: {lead[6]}")

def search_google_maps_instructions():
    """Anleitung für Google Maps Suche"""
    print("\n" + "="*50)
    print("GOOGLE MAPS LEAD-SUCHE ANLEITUNG")
    print("="*50)
    print("""
1. Öffne Google Maps: https://maps.google.com

2. Suche nach: "restaurant [Stadt]" oder "hotel [Stadt]"

3. Filtere nach Bewertungen:
   - Klicke auf "Filter"
   - Wähle 3-4 Sterne (diese brauchen am meisten Hilfe!)

4. Für jeden Business:
   a) Klicke auf die Reviews
   b) Schau ob negative Reviews unbeantwortet sind
   c) Wenn ja → Öffne die Website
   d) Finde die E-Mail Adresse (meist im Impressum/Kontakt)
   e) Füge den Lead hier hinzu

5. Sende personalisierte E-Mail mit Template aus email_templates.txt

TIPP: Fokussiere auf Businesses mit:
- 3-4 Sterne Bewertung
- Unbeantwortete negative Reviews
- Aktive Website (= kümmern sich ums Business)
""")
    input("\nDrücke Enter um fortzufahren...")

def update_lead_status():
    """Aktualisiere Status eines Leads"""
    leads_file = "leads.csv"

    if not os.path.exists(leads_file):
        print("\nNoch keine Leads vorhanden.")
        return

    with open(leads_file, 'r', encoding='utf-8') as f:
        reader = csv.reader(f)
        headers = next(reader)
        leads = list(reader)

    if not leads:
        print("Noch keine Leads vorhanden.")
        return

    print("\n" + "="*50)
    print("LEAD STATUS AKTUALISIEREN")
    print("="*50)

    for i, lead in enumerate(leads, 1):
        print(f"{i}. {lead[1]} - Status: {lead[6]}")

    try:
        choice = int(input("\nWelchen Lead aktualisieren? (Nummer): ")) - 1
        if 0 <= choice < len(leads):
            print("\nNeuer Status:")
            print("1. Neu")
            print("2. Email gesendet")
            print("3. Geantwortet")
            print("4. Free Trial")
            print("5. Bezahlt!")
            print("6. Nicht interessiert")

            status_choice = input("Wähle (1-6): ").strip()
            statuses = ["Neu", "Email gesendet", "Geantwortet", "Free Trial", "Bezahlt!", "Nicht interessiert"]

            if status_choice.isdigit() and 1 <= int(status_choice) <= 6:
                leads[choice][6] = statuses[int(status_choice)-1]

                # Speichere aktualisierte Leads
                with open(leads_file, 'w', newline='', encoding='utf-8') as f:
                    writer = csv.writer(f)
                    writer.writerow(headers)
                    writer.writerows(leads)

                print(f"\n✅ Status aktualisiert auf: {leads[choice][6]}")
    except ValueError:
        print("Ungültige Eingabe.")

def show_stats():
    """Zeige Statistiken"""
    leads_file = "leads.csv"

    if not os.path.exists(leads_file):
        print("\nNoch keine Leads vorhanden.")
        return

    with open(leads_file, 'r', encoding='utf-8') as f:
        reader = csv.reader(f)
        next(reader)  # Skip header
        leads = list(reader)

    if not leads:
        print("Noch keine Leads vorhanden.")
        return

    stats = {}
    for lead in leads:
        status = lead[6]
        stats[status] = stats.get(status, 0) + 1

    print("\n" + "="*50)
    print("DEINE STATISTIKEN")
    print("="*50)
    print(f"\nGesamt Leads: {len(leads)}")
    print("")
    for status, count in stats.items():
        print(f"  {status}: {count}")

    paid = stats.get("Bezahlt!", 0)
    print(f"\n💰 Geschätzter monatlicher Umsatz: ${paid * 39}")
    print(f"   (bei durchschnittlich $39/Kunde)")

def main():
    print("""
    ╔═══════════════════════════════════════════════════╗
    ║         REVIEWRESPONDER LEAD FINDER               ║
    ║         Finde Kunden für dein SaaS                ║
    ╚═══════════════════════════════════════════════════╝
    """)

    while True:
        print("\n--- HAUPTMENÜ ---")
        print("1. Lead manuell hinzufügen")
        print("2. Alle Leads anzeigen")
        print("3. Lead Status aktualisieren")
        print("4. Google Maps Anleitung")
        print("5. Statistiken")
        print("6. Beenden")

        choice = input("\nWähle (1-6): ").strip()

        if choice == "1":
            manual_lead_entry()
        elif choice == "2":
            show_leads()
        elif choice == "3":
            update_lead_status()
        elif choice == "4":
            search_google_maps_instructions()
        elif choice == "5":
            show_stats()
        elif choice == "6":
            print("\nViel Erfolg beim Kundengewinnen! 🚀")
            break
        else:
            print("Ungültige Auswahl.")

if __name__ == "__main__":
    main()
