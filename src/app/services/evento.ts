import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class EventoService {

  private readonly baseUrl = 'http://localhost:8080';

  constructor(private http: HttpClient) {}

  // Eventos
  getEventos(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/evento`);
  }

  getEvento(eventoId: number): Observable<any> {
    return this.http.get(`${this.baseUrl}/evento/${eventoId}`);
  }

  criarEvento(evento: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/evento`, evento);
  }

  // Receitas
  adicionarReceita(eventoId: number, receita: any): Observable<any> {
    const body = { ...receita, eventoId };
    return this.http.post(`${this.baseUrl}/receita`, body);
  }

  // Despesas
  adicionarDespesa(eventoId: number, despesa: any): Observable<any> {
    const body = { ...despesa, eventoId };
    return this.http.post(`${this.baseUrl}/despesa`, body);
  }

  // Produtos
  adicionarProduto(eventoId: number, produto: any): Observable<any> {
    const body = {
      nome: produto.nome,
      quantidadeInicial: produto.quantidadeInicial,
      valorProduto: produto.valorProduto,
      eventoId
    };
    return this.http.post(`${this.baseUrl}/produto`, body);
  }

  // Venda de produto
  venderProduto(produtoId: number, eventoId: number, quantidadeVendida: number, valorProduto: number): Observable<any> {
    const body = {
      quantidadeVendida,
      valorProduto,
      eventoId
    };
    return this.http.post(`${this.baseUrl}/produto/venda/${produtoId}`, body);
  }

  // Resumo financeiro
  resumo(eventoId: number): Observable<any> {
    return this.http.get(`${this.baseUrl}/evento/lucro/${eventoId}`);
  }
}
