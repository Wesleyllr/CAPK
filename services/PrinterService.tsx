import { SunmiInnerPrinter } from 'react-native-sunmi-inner-printer';

class PrinterService {
  private printer: typeof SunmiInnerPrinter;

  constructor() {
    this.printer = SunmiInnerPrinter;
  }

  async initPrinter() {
    try {
      await this.printer.initPrinter();
      return true;
    } catch (error) {
      console.error('Erro ao inicializar impressora:', error);
      return false;
    }
  }

  async printText(text: string) {
    try {
      await this.printer.printText(text);
      await this.printer.lineWrap(3); // Pula 3 linhas
      await this.printer.cutPaper(); // Corta o papel
    } catch (error) {
      console.error('Erro ao imprimir:', error);
      throw error;
    }
  }

  async printReceipt(order: any) {
    try {
      await this.printer.setAlignment(1); // Centralizado
      await this.printer.setFontSize(24);
      await this.printer.printText("*** COMPROVANTE ***\n");
      
      await this.printer.setFontSize(18);
      await this.printer.setAlignment(0); // Alinhado à esquerda
      
      // Cabeçalho
      await this.printer.printText(`Data: ${new Date().toLocaleString()}\n`);
      await this.printer.printText(`Pedido #${order.id}\n`);
      await this.printer.printText("------------------------\n");
      
      // Itens do pedido
      for (const item of order.items) {
        await this.printer.printText(`${item.quantity}x ${item.name}\n`);
        await this.printer.printText(`R$ ${item.price.toFixed(2)}\n`);
      }
      
      await this.printer.printText("------------------------\n");
      await this.printer.printText(`Total: R$ ${order.total.toFixed(2)}\n`);
      
      await this.printer.lineWrap(3);
      await this.printer.cutPaper();
    } catch (error) {
      console.error('Erro ao imprimir comprovante:', error);
      throw error;
    }
  }
}

export default new PrinterService();