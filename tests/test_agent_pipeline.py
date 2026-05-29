from backend.agents.parser_agent import parser_agent
from backend.agents.context_agent import context_agent
from backend.agents.query_agent import query_builder

def test_pipeline():
    query = "Which deals closing this month have gone silent?"
    print(f"Input Query: {query}")
    
    # 1. Parser Agent
    intent_data = parser_agent.execute(query)
    print(f"\n1. Parser Agent Output:")
    print(intent_data)
    
    # 2. Context Agent
    context_data = context_agent.execute(intent_data)
    print(f"\n2. Context Agent Output:")
    print(context_data)
    
    # 3. Query Agent
    sql_query = query_builder.execute(context_data, intent_data)
    print(f"\n3. Query Agent Output (SQL):")
    print(sql_query)

if __name__ == "__main__":
    test_pipeline()
