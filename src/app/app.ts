import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { EventoService } from './services/evento';

// Interfaces para tipagem
interface Receita {
  descricao: string;
  valor: number;
}

interface Despesa {
  descricao: string;
  valor: number;
}

interface Produto {
  id?: number;
  nome: string;
  quantidadeInicial: number;
  quantidadeVendida?: number;
  quantidadeRestante?: number;
  valorProduto: number;
  eventoId: number;
}

interface Evento {
  id: number;
  nome: string;
  descricao: string;
  dataEvento: string;
  receitas?: Receita[];
  despesas?: Despesa[];
  produtos?: Produto[];
}

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [FormsModule, CommonModule, HttpClientModule],
  templateUrl: './app.html',
  styleUrls: ['./app.css']
})
export class App implements OnInit {

  // EVENTO
  evento = { nome: '', descricao: '', data: '' };
  eventos: Evento[] = [];
  selectedEventoId: number | null = null;
  currentEvent: Evento | null = null;
  searchEventTerm: string = '';

  // RECEITA
  receita: Receita = { descricao: '', valor: 0 };
  receitas: Receita[] = [];

  // DESPESA
  despesa: Despesa = { descricao: '', valor: 0 };
  despesas: Despesa[] = [];

  // PRODUTO / ESTOQUE
  produto: { nome: string; quantidade: number; precoVenda: number } = { nome: '', quantidade: 0, precoVenda: 0 };
  produtos: Produto[] = [];

  // VENDA
  produtoSelecionado: Produto | null = null;
  venda = { quantidade: 1, valorUnitario: 0 };

  // RESUMO
  resumo = { totalReceitas: 0, totalDespesas: 0, lucro: 0 };

  constructor(private eventoService: EventoService) {}

  ngOnInit(): void {
    this.loadEventos();
  }

  // =================== EVENTOS ===================
  loadEventos() {
    this.eventoService.getEventos().subscribe(
      (res: Evento[]) => this.eventos = res || [],
      (err: any) => console.error('Erro ao carregar eventos', err)
    );
  }

  onSelectEvento() {
    if (!this.selectedEventoId) return;
    this.eventoService.getEvento(this.selectedEventoId).subscribe(
      (res: Evento) => this.populateFromEvent(res),
      (err: any) => console.error('Erro ao buscar evento', err)
    );
  }

  buscarEvento() {
    const term = (this.searchEventTerm || '').trim();
    if (!term) return;

    const id = Number(term);
    if (!isNaN(id) && id > 0) {
      this.eventoService.getEvento(id).subscribe(
        (res: Evento) => {
          this.populateFromEvent(res);
          this.selectedEventoId = res?.id ?? null;
        },
        () => this.searchByName(term)
      );
    } else {
      this.searchByName(term);
    }
  }

  private searchByName(term: string) {
    const found = this.eventos.find(ev => ev.nome.toLowerCase().includes(term.toLowerCase()));
    if (found) {
      this.selectedEventoId = found.id;
      this.populateFromEvent(found);
    } else {
      alert('Nenhum evento encontrado com esse termo');
    }
  }

  private populateFromEvent(ev: Evento) {
    this.currentEvent = ev;
    this.evento = {
      nome: ev.nome || '',
      descricao: ev.descricao || '',
      data: ev.dataEvento || ''
    };
    this.receitas = ev.receitas ? [...ev.receitas] : [];
    this.despesas = ev.despesas ? [...ev.despesas] : [];
    this.produtos = ev.produtos ? [...ev.produtos].map(p => ({
      ...p,
      quantidadeRestante: p.quantidadeRestante ?? p.quantidadeInicial
    })) : [];
    this.calcularResumo();
    this.produtoSelecionado = null;
  }

  criarEvento() {
    if (!this.evento.nome || !this.evento.descricao || !this.evento.data) {
      return alert('Preencha nome, descrição e data do evento');
    }
    const eventoParaEnviar = { ...this.evento };
    this.evento = { nome: '', descricao: '', data: '' };

    this.eventoService.criarEvento(eventoParaEnviar).subscribe(
      (res: Evento) => {
        this.selectedEventoId = res?.id ?? null;
        this.populateFromEvent(res);
        this.loadEventos();
      },
      (err: any) => {
        console.error('Erro ao criar evento', err);
        alert('Não foi possível criar o evento.');
      }
    );
  }

  // =================== RECEITA ===================
  adicionarReceita() {
    if (!this.currentEvent?.id) return alert('Selecione ou crie um evento primeiro');

    const receitaParaEnviar = { ...this.receita, eventoId: this.currentEvent.id };
    this.receita = { descricao: '', valor: 0 };

    this.eventoService.adicionarReceita(this.currentEvent.id, receitaParaEnviar)
      .subscribe(
        (res: Receita) => {
          this.receitas = [...this.receitas, res];
          this.calcularResumo();
        },
        (err: any) => {
          console.error('Erro ao adicionar receita', err);
          alert('Não foi possível adicionar a receita.');
        }
      );
  }

  // =================== DESPESA ===================
  adicionarDespesa() {
    if (!this.currentEvent?.id) return alert('Selecione ou crie um evento');

    const despesaParaEnviar = { ...this.despesa, eventoId: this.currentEvent.id };
    this.despesa = { descricao: '', valor: 0 };

    this.eventoService.adicionarDespesa(this.currentEvent.id, despesaParaEnviar)
      .subscribe(
        (res: Despesa) => {
          this.despesas = [...this.despesas, res];
          this.calcularResumo();
        },
        (err: any) => {
          console.error('Erro ao adicionar despesa', err);
          alert('Não foi possível adicionar a despesa.');
        }
      );
  }

  // =================== PRODUTO ===================
  adicionarProduto() {
    if (!this.currentEvent?.id) return alert('Selecione ou crie um evento');

    const nome = this.produto.nome.trim();
    const quantidadeInicial = Number(this.produto.quantidade);
    const valorProduto = Number(this.produto.precoVenda);

    if (!nome || quantidadeInicial <= 0 || valorProduto <= 0) {
      return alert('Preencha nome, quantidade e preço do produto');
    }

    const produtoParaEnviar: Produto = {
      nome,
      quantidadeInicial,
      valorProduto,
      eventoId: this.currentEvent.id
    };

    this.produto = { nome: '', quantidade: 0, precoVenda: 0 };

    this.eventoService.adicionarProduto(this.currentEvent.id, produtoParaEnviar)
      .subscribe(
        (res: Produto) => {
          this.produtos = [...this.produtos, {
            ...res,
            quantidadeRestante: res.quantidadeRestante ?? res.quantidadeInicial
          }];
          this.produtoSelecionado = null;
        },
        (err: any) => {
          console.error('Erro ao adicionar produto', err);
          alert('Não foi possível adicionar o produto.');
        }
      );
  }

  selecionarProduto(p: Produto) {
    this.produtoSelecionado = p;
    this.venda.valorUnitario = p.valorProduto || 0;
  }

  venderProduto() {
    if (!this.produtoSelecionado) return alert('Selecione um produto');

    const restante = this.produtoSelecionado.quantidadeRestante ?? 0;
    if (this.venda.quantidade > restante) return alert('Quantidade maior que o estoque');

    if (!this.produtoSelecionado.valorProduto) {
      this.produtoSelecionado.valorProduto = this.venda.valorUnitario;
    }

    const totalVenda = this.venda.quantidade * this.produtoSelecionado.valorProduto;
    this.produtoSelecionado.quantidadeRestante! -= this.venda.quantidade;

    this.receitas.push({ descricao: `Venda de ${this.produtoSelecionado.nome}`, valor: totalVenda });
    this.calcularResumo();

    this.venda = { quantidade: 1, valorUnitario: this.produtoSelecionado.valorProduto };
  }

  // =================== RESUMO ===================
  calcularResumo() {
    const totalReceitas = this.receitas.reduce((s, r) => s + Number(r.valor || 0), 0);
    const totalDespesas = this.despesas.reduce((s, d) => s + Number(d.valor || 0), 0);
    this.resumo = { totalReceitas, totalDespesas, lucro: totalReceitas - totalDespesas };
  }
}
