import re
from typing import Dict, List

from sqlalchemy.orm import Session

from app.crud.category import category


def remove_emoji_from_name(name: str) -> str:
    """Remove emojis from category name"""
    # Remove common category emojis and extra spaces
    cleaned = re.sub(r"[🛒🥗🚗🎉📺📚💊🏋️🐶📄🎁📌💼🏦💵💳]", "", name)
    cleaned = re.sub(r"\s+", " ", cleaned).strip()  # Remove extra spaces
    return cleaned


def find_category_by_name_flexible(db: Session, name: str, tipo: str = None):
    """
    Flexibly find category by name with multiple search strategies.

    Args:
        db: Database session
        name: Category name to search for
        tipo: Optional filter by type (despesa/receita)

    Returns:
        Category object if found, None otherwise
    """
    from app.crud.category import category

    # Strategy 1: Exact match
    if tipo:
        categories = category.get_by_tipo(db, tipo=tipo)
        for cat in categories:
            if cat.nome == name:
                return cat
    else:
        result = category.get_by_nome(db, nome=name)
        if result:
            return result

    # Strategy 2: Exact match without emojis
    if tipo:
        categories = category.get_by_tipo(db, tipo=tipo)
    else:
        categories = db.query(category.model).all()

    for cat in categories:
        if remove_emoji_from_name(cat.nome) == name:
            return cat

    # Strategy 3: Case-insensitive match
    name_lower = name.lower()
    for cat in categories:
        if cat.nome.lower() == name_lower:
            return cat
        if remove_emoji_from_name(cat.nome).lower() == name_lower:
            return cat

    # Strategy 4: Partial match (contains)
    for cat in categories:
        if name_lower in cat.nome.lower():
            return cat
        if name_lower in remove_emoji_from_name(cat.nome).lower():
            return cat

    return None


class CategoryFilterService:
    """Service for intelligent category filtering based on message content"""

    def __init__(self):
        # Keywords mapping por categoria (id -> keywords)
        self.category_keywords = {
            1: [
                "mercado",
                "supermercado",
                "feira",
                "compras",
                "alimentos",
                "grocery",
                "market",
            ],
            2: [
                "restaurante",
                "comida",
                "lanche",
                "delivery",
                "ifood",
                "uber eats",
                "food",
                "pizza",
                "burguer",
                "lanches",
            ],
            3: [
                "combustível",
                "gasolina",
                "álcool",
                "etanol",
                "posto",
                "shell",
                "ipiranga",
                "br",
                "uber",
                "taxi",
                "carro",
                "auto",
                "veículo",
            ],
            4: [
                "cinema",
                "festa",
                "balada",
                "jogo",
                "diversão",
                "shopping",
                "parque",
                "entretenimento",
                "lazer",
                "show",
            ],
            5: [
                "conta",
                "luz",
                "água",
                "internet",
                "telefone",
                "tv",
                "streaming",
                "netflix",
                "spotify",
                "fatura",
                "boleto",
            ],
            6: [
                "curso",
                "escola",
                "faculdade",
                "livro",
                "educação",
                "estudo",
                "universidade",
                "aula",
                "material",
            ],
            7: [
                "médico",
                "farmácia",
                "remédio",
                "hospital",
                "consulta",
                "saúde",
                "dentista",
                "exame",
                "medicamento",
            ],
            8: [
                "academia",
                "gym",
                "musculação",
                "personal",
                "treino",
                "exercício",
                "fitness",
            ],
            9: [
                "pet",
                "cachorro",
                "gato",
                "veterinário",
                "ração",
                "animal",
                "dog",
                "cat",
                "petshop",
            ],
            10: [
                "aluguel",
                "imóvel",
                "casa",
                "apartamento",
                "rent",
                "moradia",
                "habitação",
            ],
            11: [
                "presente",
                "aniversário",
                "natal",
                "gift",
                "lembrança",
                "mimo",
                "surpresa",
            ],
            12: [],  # Outros - sem keywords específicas
            13: [
                "salário",
                "salario",
                "pagamento",
                "trabalho",
                "empresa",
                "salary",
                "wage",
                "emprego",
                "ordenado",
                "salario",
            ],
            14: [
                "juros",
                "investimento",
                "poupança",
                "banco",
                "rendimento",
                "dividend",
                "lucro",
            ],
            15: [
                "extra",
                "freelance",
                "bico",
                "vendas",
                "comissão",
                "bonus",
                "adicional",
            ],
            16: ["reembolso", "devolução", "estorno", "cashback", "volta", "retorno"],
            17: [],  # Outras receitas - sem keywords específicas
        }

        # Keywords para detectar tipo (receita vs despesa)
        self.receita_keywords = [
            "recebi",
            "recebimento",
            "salário",
            "pagamento",
            "renda",
            "ganho",
            "lucro",
            "received",
            "income",
            "salary",
            "payment",
            "bonus",
            "prize",
            "prêmio",
        ]

        self.despesa_keywords = [
            "paguei",
            "gastei",
            "comprei",
            "pago",
            "gasto",
            "despesa",
            "custo",
            "paid",
            "spent",
            "bought",
            "expense",
            "cost",
            "purchase",
        ]

    def normalize_text(self, text: str) -> str:
        """Normalize text for better keyword matching"""
        text = text.lower()
        # Remove acentos básicos
        text = (
            text.replace("ã", "a").replace("á", "a").replace("à", "a").replace("â", "a")
        )
        text = text.replace("é", "e").replace("ê", "e").replace("ë", "e")
        text = text.replace("í", "i").replace("î", "i").replace("ï", "i")
        text = text.replace("ó", "o").replace("ô", "o").replace("õ", "o")
        text = text.replace("ú", "u").replace("û", "u").replace("ü", "u")
        text = text.replace("ç", "c")
        # Remove caracteres especiais, mantém apenas letras, números e espaços
        text = re.sub(r"[^\w\s]", " ", text)
        return text

    def detect_transaction_type(self, message: str) -> str:
        """Detect if message indicates receita or despesa"""
        normalized_msg = self.normalize_text(message)

        receita_score = sum(
            1 for keyword in self.receita_keywords if keyword in normalized_msg
        )
        despesa_score = sum(
            1 for keyword in self.despesa_keywords if keyword in normalized_msg
        )

        if receita_score > despesa_score:
            return "receita"
        else:
            return "despesa"  # Default to despesa as it's more common

    def calculate_category_score(self, message: str, category_id: int) -> float:
        """Calculate relevance score for a category based on message content"""
        if category_id not in self.category_keywords:
            return 0.0

        keywords = self.category_keywords[category_id]
        if not keywords:  # Categoria "Outros" sem keywords específicas
            return 0.0  # Don't auto-include "Outros" categories

        normalized_msg = self.normalize_text(message)

        # Count keyword matches
        matches = 0
        # total_keywords = len(keywords)

        for keyword in keywords:
            if keyword in normalized_msg:
                matches += 1

        # Calculate score with bonus for multiple matches
        if matches == 0:
            return 0.0
        elif matches == 1:
            return 0.6
        elif matches == 2:
            return 0.8
        else:
            return 0.95

    def filter_categories(
        self,
        db: Session,
        message: str,
        max_categories: int = 3,
        min_score: float = 0.1,
        remove_emojis: bool = False,
    ) -> Dict:
        """Filter and score categories based on message content"""

        # Detect transaction type
        detected_type = self.detect_transaction_type(message)

        # Get all categories of detected type
        categories = category.get_by_tipo(db, tipo=detected_type)

        # Calculate scores for each category
        scored_categories = []
        for cat in categories:
            score = self.calculate_category_score(message, cat.id)
            if score >= min_score:
                category_name = (
                    remove_emoji_from_name(cat.nome) if remove_emojis else cat.nome
                )
                scored_categories.append(
                    {
                        "id": cat.id,
                        "nome": category_name,
                        "tipo": cat.tipo,
                        "confidence": score,
                    }
                )

        # Sort by confidence and limit results
        scored_categories.sort(key=lambda x: x["confidence"], reverse=True)

        # Check if best match is relevant (score >= 0.3)
        # If not relevant, we'll return full category list
        best_score = scored_categories[0]["confidence"] if scored_categories else 0.0
        use_full_list = best_score < 0.3

        # If no good matches, mark to use full list
        if not scored_categories or use_full_list:
            # For full list mode, we still need some categories for the response structure
            # But the compact format will use the full list instead
            if not scored_categories:
                for cat in categories[:max_categories]:
                    category_name = (
                        remove_emoji_from_name(cat.nome) if remove_emojis else cat.nome
                    )
                    scored_categories.append(
                        {
                            "id": cat.id,
                            "nome": category_name,
                            "tipo": cat.tipo,
                            "confidence": 0.1,
                        }
                    )

        # Limit to max_categories (only used if not using full list)
        filtered_categories = scored_categories[:max_categories]

        # Get all categories for complete list
        all_despesas = category.get_by_tipo(db, tipo="despesa")
        all_receitas = category.get_by_tipo(db, tipo="receita")

        # Calculate token savings
        total_categories = len(all_despesas) + len(all_receitas)
        filtered_count = len(filtered_categories)
        tokens_saved_percent = max(
            0, (total_categories - filtered_count) / total_categories * 100
        )

        return {
            "tipo_sugerido": detected_type,
            "categorias_filtradas": filtered_categories,
            "categorias_completas": {
                "despesas": [{"id": cat.id, "nome": cat.nome} for cat in all_despesas],
                "receitas": [{"id": cat.id, "nome": cat.nome} for cat in all_receitas],
            },
            "tokens_saved_percent": round(tokens_saved_percent, 1),
            "ai_prompt_suggestion": self._generate_ai_prompt(filtered_categories),
            "message_analysis": {
                "detected_type": detected_type,
                "total_categories_available": len(categories),
                "categories_filtered": filtered_count,
                "confidence_threshold": min_score,
            },
            "use_full_list": use_full_list,  # Indica se deve usar lista completa
            "best_score": best_score,  # Melhor score encontrado
        }

    def _generate_ai_prompt(self, categories: List[Dict]) -> str:
        """Generate optimized prompt for AI with filtered categories"""
        if not categories:
            return "Escolha a categoria mais adequada da lista completa"

        category_names = [cat["nome"] for cat in categories]
        if len(category_names) == 1:
            return f"Categoria sugerida: {category_names[0]}"
        else:
            return f"Escolha entre: {', '.join(category_names)}"

    def get_compact_format_for_ai(self, filter_result: Dict) -> Dict:
        """Generate ultra-compact format for AI to save tokens"""
        filtered = filter_result["categorias_filtradas"]
        use_full_list = filter_result.get("use_full_list", False)

        # If no relevant match found (best_score < 0.3), use complete list
        if use_full_list:
            return {
                "msg_type": filter_result["tipo_sugerido"],
                "categories": [
                    cat["nome"]
                    for cat in filter_result["categorias_completas"][
                        (
                            "despesas"
                            if filter_result["tipo_sugerido"] == "despesa"
                            else "receitas"
                        )
                    ]
                ],
                "full_list": True,
            }

        # If we have good matches, use filtered categories
        if len(filtered) <= 3:
            # Use only filtered categories
            return {
                "msg_type": filter_result["tipo_sugerido"],
                "categories": [
                    cat["nome"]
                    .replace("🛒 ", "")
                    .replace("🥗 ", "")
                    .replace("🚗 ", "")
                    .replace("🎉 ", "")
                    .replace("📺 ", "")
                    .replace("📚 ", "")
                    .replace("💊 ", "")
                    .replace("🏋️ ", "")
                    .replace("🐶 ", "")
                    .replace("📄 ", "")
                    .replace("🎁 ", "")
                    .replace("📌 ", "")
                    .replace("💼 ", "")
                    .replace("🏦 ", "")
                    .replace("💵 ", "")
                    .replace("💳 ", "")
                    for cat in filtered
                ],
                "full_list": False,
            }
        else:
            # Use complete list if too many matches
            return {
                "msg_type": filter_result["tipo_sugerido"],
                "categories": [
                    cat["nome"]
                    for cat in filter_result["categorias_completas"][
                        (
                            "despesas"
                            if filter_result["tipo_sugerido"] == "despesa"
                            else "receitas"
                        )
                    ]
                ],
                "full_list": True,
            }


# Singleton instance
category_filter_service = CategoryFilterService()
