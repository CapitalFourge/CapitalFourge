#!/usr/bin/env python3
"""
Generador de reporte PDF para portafolios.
Recibe: JSON del portfolio + path de salida PDF
Genera: PDF con resumen, posiciones, transacciones y métricas
"""
import json
import sys
from pathlib import Path
from datetime import datetime
from decimal import Decimal

# ReportLab para generar PDF
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch, cm
from reportlab.lib.colors import HexColor
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
    PageBreak, KeepTogether
)
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT
from reportlab.lib import colors


class PortfolioReportGenerator:
    def __init__(self):
        self.styles = getSampleStyleSheet()
        self._setup_custom_styles()
    
    def _setup_custom_styles(self):
        # Título principal
        self.styles.add(ParagraphStyle(
            name='CustomTitle',
            parent=self.styles['Title'],
            fontSize=24,
            textColor=HexColor('#1a1a2e'),
            spaceAfter=6,
            alignment=TA_CENTER,
        ))
        
        # Subtítulo
        self.styles.add(ParagraphStyle(
            name='CustomSubtitle',
            parent=self.styles['Normal'],
            fontSize=12,
            textColor=HexColor('#6b7280'),
            spaceAfter=20,
            alignment=TA_CENTER,
        ))
        
        # Sección header
        self.styles.add(ParagraphStyle(
            name='SectionHeader',
            parent=self.styles['Heading2'],
            fontSize=14,
            textColor=HexColor('#1a1a2e'),
            spaceBefore=16,
            spaceAfter=8,
            borderWidth=0,
            borderPadding=0,
        ))
        
        # Texto normal
        self.styles.add(ParagraphStyle(
            name='CustomBody',
            parent=self.styles['Normal'],
            fontSize=10,
            textColor=HexColor('#374151'),
            leading=14,
        ))
        
        # Valor monetario
        self.styles.add(ParagraphStyle(
            name='MoneyValue',
            parent=self.styles['Normal'],
            fontSize=11,
            textColor=HexColor('#059669'),
            alignment=TA_RIGHT,
        ))
        
        # Valor monetario negativo
        self.styles.add(ParagraphStyle(
            name='MoneyValueNeg',
            parent=self.styles['Normal'],
            fontSize=11,
            textColor=HexColor('#dc2626'),
            alignment=TA_RIGHT,
        ))
        
        # Label
        self.styles.add(ParagraphStyle(
            name='LabelStyle',
            parent=self.styles['Normal'],
            fontSize=10,
            textColor=HexColor('#6b7280'),
        ))

    def _format_money(self, value):
        """Formatea un valor monetario"""
        if value is None:
            return "$0.00"
        try:
            val = Decimal(str(value))
            return f"${val:,.2f}"
        except:
            return "$0.00"

    def _format_date(self, date_str):
        """Formatea fecha ISO a formato legible"""
        if not date_str:
            return ""
        try:
            dt = datetime.fromisoformat(date_str.replace('Z', '+00:00'))
            return dt.strftime('%d/%m/%Y %H:%M')
        except:
            return date_str

    def generate(self, portfolio_data: dict, output_path: Path) -> Path:
        doc = SimpleDocTemplate(
            str(output_path),
            pagesize=A4,
            rightMargin=2*cm,
            leftMargin=2*cm,
            topMargin=2*cm,
            bottomMargin=2*cm,
        )
        
        story = []
        
        # ========== PORTADA ==========
        story.append(Spacer(1, 4*cm))
        story.append(Paragraph("REPORTE DE PORTAFOLIO", self.styles['CustomTitle']))
        story.append(Spacer(1, 0.5*cm))
        story.append(Paragraph(portfolio_data.get('name', 'Sin nombre'), self.styles['CustomSubtitle']))
        story.append(Spacer(1, 1*cm))
        
        # Info básica en tabla
        info_data = [
            ['ID', portfolio_data.get('id', 'N/A')],
            ['Descripción', portfolio_data.get('description', 'Sin descripción')],
            ['Fecha de generación', datetime.now().strftime('%d/%m/%Y %H:%M')],
            ['Público', 'Sí' if portfolio_data.get('isPublic') else 'No'],
            ['Share Slug', portfolio_data.get('shareSlug', 'N/A')],
        ]
        
        info_table = Table(info_data, colWidths=[4*cm, 12*cm])
        info_table.setStyle(TableStyle([
            ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, -1), 10),
            ('TEXTCOLOR', (0, 0), (0, -1), HexColor('#6b7280')),
            ('TEXTCOLOR', (1, 0), (1, -1), HexColor('#374151')),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
            ('TOPPADDING', (0, 0), (-1, -1), 6),
            ('GRID', (0, 0), (-1, -1), 0.5, HexColor('#e5e7eb')),
        ]))
        story.append(info_table)
        story.append(Spacer(1, 1.5*cm))
        
        # ========== RESUMEN FINANCIERO ==========
        story.append(Paragraph("RESUMEN FINANCIERO", self.styles['SectionHeader']))
        
        positions = portfolio_data.get('positions', [])
        transactions = portfolio_data.get('transactions', [])
        orders = portfolio_data.get('orders', [])
        
        total_value = Decimal('0')
        for p in positions:
            try:
                qty = Decimal(str(p.get('quantity', 0)))
                price = Decimal(str(p.get('currentPrice', p.get('averagePurchasePrice', 0))))
                total_value += qty * price
            except:
                pass
        
        cumulative_deposits = Decimal(str(portfolio_data.get('cumulativeDeposits', 0)))
        cumulative_withdrawals = Decimal(str(portfolio_data.get('cumulativeWithdrawals', 0)))
        net_invested = cumulative_deposits - cumulative_withdrawals
        pnl = total_value - net_invested
        pnl_pct = (pnl / net_invested * 100) if net_invested > 0 else Decimal('0')
        
        summary_data = [
            ['Concepto', 'Valor'],
            ['Valor total actual', self._format_money(total_value)],
            ['Capital neto invertido', self._format_money(net_invested)],
            ['  Depósitos acumulados', self._format_money(cumulative_deposits)],
            ['  Retiros acumulados', self._format_money(cumulative_withdrawals)],
            ['Ganancia/Pérdida neta', self._format_money(pnl)],
            ['Rentabilidad', f"{pnl_pct:.2f}%"],
        ]
        
        summary_table = Table(summary_data, colWidths=[8*cm, 8*cm])
        summary_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), HexColor('#1a1a2e')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, -1), 10),
            ('ALIGN', (1, 0), (1, -1), 'RIGHT'),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
            ('TOPPADDING', (0, 0), (-1, -1), 8),
            ('GRID', (0, 0), (-1, -1), 0.5, HexColor('#e5e7eb')),
            ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, HexColor('#f9fafb')]),
            # Color P&L
            ('TEXTCOLOR', (1, 5), (1, 5), HexColor('#059669') if pnl >= 0 else HexColor('#dc2626')),
            ('TEXTCOLOR', (1, 6), (1, 6), HexColor('#059669') if pnl_pct >= 0 else HexColor('#dc2626')),
            ('FONTNAME', (1, 5), (1, 6), 'Helvetica-Bold'),
        ]))
        story.append(summary_table)
        story.append(Spacer(1, 1*cm))
        
        # ========== POSICIONES ACTUALES ==========
        if positions:
            story.append(PageBreak())
            story.append(Paragraph("POSICIONES ACTUALES", self.styles['SectionHeader']))
            
            pos_data = [['Símbolo', 'Cantidad', 'Precio Prom.', 'Precio Actual', 'Valor Total', 'G/P', 'G/P %']]
            for pos in positions:
                try:
                    qty = Decimal(str(pos.get('quantity', 0)))
                    avg_price = Decimal(str(pos.get('averagePurchasePrice', 0)))
                    curr_price = Decimal(str(pos.get('currentPrice', avg_price)))
                    total = qty * curr_price
                    invested = qty * avg_price
                    pnl_pos = total - invested
                    pnl_pct_pos = (pnl_pos / invested * 100) if invested > 0 else Decimal('0')
                    
                    pos_data.append([
                        pos.get('symbol', 'N/A'),
                        f"{qty:,.4f}",
                        self._format_money(avg_price),
                        self._format_money(curr_price),
                        self._format_money(total),
                        self._format_money(pnl_pos),
                        f"{pnl_pct_pos:.2f}%",
                    ])
                except:
                    pos_data.append([
                        pos.get('symbol', 'N/A'),
                        'N/A', 'N/A', 'N/A', 'N/A', 'N/A', 'N/A'
                    ])
            
            pos_table = Table(pos_data, colWidths=[2.2*cm, 2*cm, 2.2*cm, 2.2*cm, 2.5*cm, 2.2*cm, 2.2*cm])
            pos_table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), HexColor('#1a1a2e')),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
                ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                ('FONTSIZE', (0, 0), (-1, -1), 9),
                ('ALIGN', (1, 0), (-1, -1), 'RIGHT'),
                ('ALIGN', (0, 0), (0, -1), 'LEFT'),
                ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
                ('TOPPADDING', (0, 0), (-1, -1), 6),
                ('GRID', (0, 0), (-1, -1), 0.5, HexColor('#e5e7eb')),
                ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, HexColor('#f9fafb')]),
            ]))
            story.append(pos_table)
            story.append(Spacer(1, 1*cm))
        
        # ========== TRANSACCIONES RECIENTES ==========
        if transactions:
            story.append(PageBreak())
            story.append(Paragraph("TRANSACCIONES RECIENTES (últimas 50)", self.styles['SectionHeader']))
            
            # Ordenar por timestamp descendente
            sorted_tx = sorted(
                transactions, 
                key=lambda x: x.get('timestamp', ''), 
                reverse=True
            )[:50]
            
            tx_data = [['Fecha', 'Símbolo', 'Tipo', 'Cantidad', 'Precio', 'Total']]
            for tx in sorted_tx:
                tx_type = tx.get('type', 'N/A')
                type_color = HexColor('#059669') if tx_type == 'BUY' else HexColor('#dc2626')
                
                tx_data.append([
                    self._format_date(tx.get('timestamp', '')),
                    tx.get('symbol', 'N/A'),
                    tx_type,
                    f"{Decimal(str(tx.get('quantity', 0))):,.4f}",
                    self._format_money(tx.get('price', 0)),
                    self._format_money(tx.get('totalAmount', tx.get('balanceTransaction', 0))),
                ])
            
            tx_table = Table(tx_data, colWidths=[3*cm, 2*cm, 2*cm, 2.5*cm, 2.5*cm, 3*cm])
            tx_table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), HexColor('#1a1a2e')),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
                ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                ('FONTSIZE', (0, 0), (-1, -1), 8),
                ('ALIGN', (3, 0), (-1, -1), 'RIGHT'),
                ('ALIGN', (0, 0), (0, -1), 'CENTER'),
                ('ALIGN', (2, 0), (2, -1), 'CENTER'),
                ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
                ('TOPPADDING', (0, 0), (-1, -1), 5),
                ('GRID', (0, 0), (-1, -1), 0.5, HexColor('#e5e7eb')),
                ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, HexColor('#f9fafb')]),
            ]))
            story.append(tx_table)
            story.append(Spacer(1, 1*cm))
        
        # ========== ÓRDENES PENDIENTES ==========
        pending_orders = [o for o in orders if o.get('status') == 'PENDING']
        if pending_orders:
            story.append(PageBreak())
            story.append(Paragraph("ÓRDENES PENDIENTES", self.styles['SectionHeader']))
            
            ord_data = [['Símbolo', 'Tipo', 'Cantidad', 'Precio Objetivo', 'Valor USD', 'Creada']]
            for ord in pending_orders:
                ord_data.append([
                    ord.get('symbol', 'N/A'),
                    ord.get('type', 'N/A'),
                    f"{Decimal(str(ord.get('quantity', 0))):,.4f}",
                    self._format_money(ord.get('targetPrice', 0)),
                    self._format_money(ord.get('usdAmount', 0)),
                    self._format_date(ord.get('createdAt', '')),
                ])
            
            ord_table = Table(ord_data, colWidths=[2.5*cm, 2.5*cm, 2.5*cm, 3*cm, 3*cm, 3*cm])
            ord_table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), HexColor('#1a1a2e')),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
                ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                ('FONTSIZE', (0, 0), (-1, -1), 9),
                ('ALIGN', (2, 0), (-1, -1), 'RIGHT'),
                ('ALIGN', (0, 0), (1, -1), 'LEFT'),
                ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
                ('TOPPADDING', (0, 0), (-1, -1), 6),
                ('GRID', (0, 0), (-1, -1), 0.5, HexColor('#e5e7eb')),
                ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, HexColor('#f9fafb')]),
            ]))
            story.append(ord_table)
        
        # Footer en cada página
        def add_page_number(canvas, doc):
            page_num = canvas.getPageNumber()
            text = f"Capital Fourge - Reporte generado el {datetime.now().strftime('%d/%m/%Y')} - Página {page_num}"
            canvas.saveState()
            canvas.setFont('Helvetica', 8)
            canvas.setFillColor(HexColor('#9ca3af'))
            canvas.drawCentredString(A4[0]/2, 1*cm, text)
            canvas.restoreState()
        
        doc.build(story, onFirstPage=add_page_number, onLaterPages=add_page_number)
        return output_path


def main():
    if len(sys.argv) != 3:
        print("Uso: python generator.py <input_json> <output_pdf>")
        sys.exit(1)
    
    input_json = Path(sys.argv[1])
    output_pdf = Path(sys.argv[2])
    
    if not input_json.exists():
        print(f"Error: Archivo JSON no encontrado: {input_json}")
        sys.exit(1)
    
    with open(input_json, 'r', encoding='utf-8') as f:
        portfolio_data = json.load(f)
    
    generator = PortfolioReportGenerator()
    generator.generate(portfolio_data, output_pdf)
    print(f"Reporte generado: {output_pdf}")


if __name__ == '__main__':
    main()