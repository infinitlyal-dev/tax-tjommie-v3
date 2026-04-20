"""Generate a realistic SA bank statement PDF for parser testing."""
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm

TXNS = [
    ("2026-03-01", "OPENING BALANCE",                                   None,   15234.12),
    ("2026-03-02", "DEBIT ORDER DISCOVERY HEALTH 1234567",              -3890.00, 11344.12),
    ("2026-03-02", "WOOLWORTHS SEA POINT 4012",                         -847.50,  10496.62),
    ("2026-03-03", "CHECKERS HYPER RONDEBOSCH",                         -1254.80,  9241.82),
    ("2026-03-03", "ENGEN CAMPS BAY",                                    -895.00,  8346.82),
    ("2026-03-04", "UBER TRIP CAPE TOWN",                                -142.00,  8204.82),
    ("2026-03-05", "SALARY - INFINITY FILMS",                          38750.00, 46954.82),
    ("2026-03-05", "DSTV PREMIUM DEBIT ORDER",                           -899.00, 46055.82),
    ("2026-03-06", "TAKEALOT.COM ORDER 99881234",                       -2450.00, 43605.82),
    ("2026-03-07", "ORMS DIRECT CAMERALAND",                           -12890.00, 30715.82),
    ("2026-03-08", "VODACOM AIRTIME TOPUP",                              -500.00, 30215.82),
    ("2026-03-09", "FNB MONTHLY SERVICE FEE",                            -125.00, 30090.82),
    ("2026-03-10", "ATM WITHDRAWAL SEA POINT",                          -1500.00, 28590.82),
    ("2026-03-11", "NETFLIX SUBSCRIPTION",                               -199.00, 28391.82),
    ("2026-03-12", "SHELL PLUMSTEAD",                                    -780.00, 27611.82),
    ("2026-03-13", "PICK N PAY SEA POINT",                              -623.45, 26988.37),
    ("2026-03-14", "WOOLWORTHS CAPE TOWN",                              -412.30, 26576.07),
    ("2026-03-15", "TRANSFER TO CREDIT CARD",                          -5000.00, 21576.07),
    ("2026-03-16", "ADOBE CREATIVE CLOUD SUBSCRIPTION",                  -899.00, 20677.07),
    ("2026-03-17", "BOLT TRIP",                                           -89.50, 20587.57),
    ("2026-03-18", "CITY OF CAPE TOWN MUNICIPAL",                      -2340.00, 18247.57),
    ("2026-03-19", "OLD MUTUAL RETIREMENT ANNUITY",                    -2500.00, 15747.57),
    ("2026-03-20", "DROPBOX BUSINESS SUBSCRIPTION",                      -299.00, 15448.57),
    ("2026-03-21", "BAXTER THEATRE TICKETS",                             -450.00, 14998.57),
    ("2026-03-22", "BP NEWLANDS",                                        -920.00, 14078.57),
    ("2026-03-23", "NANDOS SEA POINT",                                   -265.00, 13813.57),
    ("2026-03-24", "KAUAI V&A WATERFRONT",                              -187.00, 13626.57),
    ("2026-03-25", "GITHUB PROFESSIONAL SUB",                             -89.00, 13537.57),
    ("2026-03-26", "ZANDER LAW CONSULTING - LEGAL FEES INVOICE 2041",  -4500.00,  9037.57),
    ("2026-03-27", "PICK N PAY LIQUOR",                                  -685.00,  8352.57),
    ("2026-03-28", "TRAIN TICKET METRORAIL",                              -35.00,  8317.57),
    ("2026-03-29", "TAKEALOT PHOTO LIGHTING KIT",                      -3890.00,  4427.57),
    ("2026-03-30", "EFT RECEIVED FROM CLIENT - PAYMENT INV 004",      12500.00, 16927.57),
    ("2026-03-31", "BANK CHARGES",                                        -45.00, 16882.57),
    ("2026-03-31", "CLOSING BALANCE",                                   None,    16882.57),
]

c = canvas.Canvas("test_statement.pdf", pagesize=A4)
w, h = A4

c.setFont("Helvetica-Bold", 14)
c.drawString(20*mm, h-20*mm, "FNB CHEQUE ACCOUNT STATEMENT")
c.setFont("Helvetica", 9)
c.drawString(20*mm, h-26*mm, "Account Holder: A SNYMAN  |  Account: 62001234567  |  Period: 01 Mar 2026 - 31 Mar 2026")

c.setFont("Helvetica-Bold", 8)
y = h - 36*mm
c.drawString(20*mm, y, "Date")
c.drawString(40*mm, y, "Description")
c.drawString(130*mm, y, "Amount")
c.drawString(160*mm, y, "Balance")
c.line(20*mm, y-1*mm, 190*mm, y-1*mm)

c.setFont("Helvetica", 8)
y -= 5*mm
for date, desc, amt, bal in TXNS:
    if y < 20*mm:
        c.showPage()
        c.setFont("Helvetica", 8)
        y = h - 20*mm
    c.drawString(20*mm, y, date)
    c.drawString(40*mm, y, desc[:55])
    if amt is not None:
        c.drawRightString(155*mm, y, f"{amt:,.2f}")
    c.drawRightString(190*mm, y, f"{bal:,.2f}")
    y -= 4.2*mm

c.save()
print(f"Created test_statement.pdf with {sum(1 for t in TXNS if t[2] is not None)} transactions")
