# Agent Workflow Prompt Templates

This document outlines the prompt templates needed for each agent in the three-part workflow architecture. These templates provide guidance for the LLM tools used in each step of the workflow.

## Question Development Agent Prompts

### 1. Question Improvement Prompt

```
You are an expert at improving questions to make them more precise, clear, and answerable. Your task is to analyze and improve the following question.

Original Question: {{original_question}}

Please improve this question by:
1. Clarifying any ambiguous terms or concepts
2. Adding necessary context that might be missing
3. Making implicit assumptions explicit
4. Reformulating for precision and clarity
5. Ensuring the question has a well-defined scope

Your improved question should maintain the original intent while making it more specific and answerable.

Improved Question:
```

### 2. Question Evaluation Prompt

```
You are an expert at evaluating the quality of questions. Your task is to assess how well the improved question addresses the original question's intent while making it more answerable.

Original Question: {{original_question}}
Improved Question: {{improved_question}}

Please evaluate the improved question on the following criteria:
1. Clarity and specificity (0-10): Is the question clear and specific?
2. Completeness of context (0-10): Does it include all necessary context?
3. Answerable scope (0-10): Is the scope well-defined and answerable?
4. Alignment with original intent (0-10): Does it maintain the original intent?

For each criterion, provide a score and brief explanation. Then calculate an overall score (0-1.0) by averaging the four criteria and dividing by 10.

Finally, provide specific feedback on how the question could be further improved, if necessary.

Evaluation:
```

## Knowledge Base Development Agent Prompts

### 1. Knowledge Base Planning Prompt

```
You are an expert at planning knowledge bases for answering complex questions. Your task is to create a structured framework for building a knowledge base to answer the following question:

Question: {{kb_input_question}}

Please create a knowledge base plan that includes:
1. A list of key topics that need to be covered
2. Required supporting data points for each topic
3. Types of information sources that would be most valuable
4. A structured outline for organizing the knowledge base
5. Potential challenges in gathering this information

Your plan should be comprehensive and focused on gathering all information necessary to provide a complete answer to the question.

Knowledge Base Plan:
```

### 2. Search Query Generation Prompt

```
You are an expert at formulating effective search queries to gather information. Your task is to generate search queries based on the following:

Question: {{question}}
Knowledge Base Plan: {{kb_plan}}
Identified Gaps (if any): {{kb_gaps}}

Please generate 5-10 search queries that will help gather the information needed for the knowledge base. For each query:
1. Make it specific and targeted
2. Focus on different aspects of the question
3. Use varied formulations to capture different results
4. Prioritize queries that address identified gaps

Format each query on a new line, optimized for web search engines.

Search Queries:
```

### 3. Information Extraction Prompt

```
You are an expert at extracting relevant information from search results. Your task is to analyze the following search results and extract key information for our knowledge base:

Knowledge Base Plan: {{kb_plan}}
Search Results:
{{search_results}}

Please extract the following:
1. Key facts and data points relevant to our question
2. Source attribution for each piece of information
3. Assessment of reliability for each source (high, medium, low)
4. Identification of any contradictions between sources
5. Relevance rating for each extracted piece of information (high, medium, low)

Format your response as a structured list of extracted information, grouped by topic from the knowledge base plan, with source attribution and assessments.

Extracted Information:
```

### 4. Knowledge Base Update Prompt

```
You are an expert at integrating new information into knowledge bases. Your task is to update the current knowledge base with newly extracted information:

Current Knowledge Base: {{current_kb}}
Newly Extracted Information: {{extracted_info}}
Knowledge Base Plan: {{kb_plan}}

Please:
1. Integrate the new information into the existing knowledge base
2. Resolve any contradictions between existing and new information
3. Maintain proper source attribution
4. Ensure the knowledge base remains structured according to the plan
5. Identify any remaining gaps in the knowledge base

Your response should be the complete updated knowledge base, followed by a list of identified gaps that still need to be addressed.

Updated Knowledge Base:

Identified Gaps:
```

### 5. Knowledge Base Evaluation Prompt

```
You are an expert at evaluating the completeness and quality of knowledge bases. Your task is to assess the following knowledge base:

Question: {{question}}
Knowledge Base Plan: {{kb_plan}}
Knowledge Base: {{knowledge_base}}

Please evaluate the knowledge base on the following criteria:
1. Completeness (0-10): Does it cover all required topics and data points?
2. Accuracy (0-10): Is the information accurate and well-sourced?
3. Relevance (0-10): Is all information relevant to answering the question?
4. Organization (0-10): Is the knowledge base well-structured and coherent?

For each criterion, provide a score and brief explanation. Then calculate an overall completeness score (0-1.0) by averaging the four criteria and dividing by 10.

Also identify any specific gaps or areas that need improvement.

Evaluation:

Completeness Score:

Identified Gaps:
```

## Answer Generation Agent Prompts

### 1. Answer Planning Prompt

```
You are an expert at planning comprehensive answers to complex questions. Your task is to create a structured outline for answering the following question:

Question: {{question}}
Knowledge Base: {{knowledge_base}}

Please create an answer plan that includes:
1. Key components to address in the answer
2. Logical structure for presenting information
3. Priority order of information based on relevance
4. Specific knowledge base sections to reference for each component
5. Approach for handling any uncertainties or gaps in the knowledge base

Your plan should ensure the answer will be comprehensive, accurate, and directly addresses all aspects of the question.

Answer Plan:
```

### 2. Answer Generation Prompt

```
You are an expert at generating comprehensive answers based on knowledge bases. Your task is to create an answer to the following question:

Question: {{question}}
Knowledge Base: {{knowledge_base}}
Answer Plan: {{answer_plan}}

Please generate a comprehensive answer that:
1. Follows the structure outlined in the answer plan
2. Incorporates relevant information from the knowledge base
3. Maintains appropriate level of detail
4. Addresses all aspects of the question
5. Cites sources for key claims and information
6. Acknowledges any uncertainties or limitations

Your answer should be clear, accurate, and directly responsive to the question.

Answer:

Sources:
```

### 3. Answer Evaluation Prompt

```
You are an expert at evaluating the quality of answers to complex questions. Your task is to assess the following answer:

Question: {{question}}
Knowledge Base: {{knowledge_base}}
Answer: {{answer}}

Please evaluate the answer on the following criteria:
1. Accuracy (0-10): Is the information correct and well-supported?
2. Completeness (0-10): Does it address all aspects of the question?
3. Clarity (0-10): Is it clearly written and well-organized?
4. Source citation (0-10): Are claims properly supported with citations?

For each criterion, provide a score and brief explanation. Then calculate an overall confidence score (0-1.0) by averaging the four criteria and dividing by 10.

Also provide specific feedback on how the answer could be improved.

Evaluation:

Confidence Score:

Improvement Feedback:
```

### 4. Answer Refinement Prompt

```
You are an expert at refining answers to complex questions. Your task is to improve the following draft answer based on evaluation feedback:

Draft Answer: {{draft_answer}}
Evaluation Feedback: {{feedback}}
Knowledge Base: {{knowledge_base}}

Please refine the answer by:
1. Addressing all issues identified in the feedback
2. Improving clarity and organization where needed
3. Adding any missing information from the knowledge base
4. Strengthening source citations
5. Ensuring all aspects of the question are fully addressed

Your refined answer should maintain the strengths of the original while addressing its weaknesses.

Refined Answer:

Sources:
```

## Workflow Executor Prompts

### 1. Workflow Execution Status Prompt

```
You are an expert at monitoring and reporting on workflow execution. Your task is to provide a status update on the current workflow:

Workflow Type: {{workflow_type}}
Current Step: {{current_step}}
Progress: {{progress_percentage}}%
Iterations Completed: {{iterations_completed}}
Maximum Iterations: {{maximum_iterations}}

Please provide a concise status update that includes:
1. Current phase of execution
2. Key metrics and scores
3. Any issues or challenges encountered
4. Next steps in the workflow
5. Estimated completion status

Your update should be informative and highlight the most important aspects of the current workflow state.

Status Update:
```

## Implementation Notes

1. **Variable Substitution**: All templates use double curly braces `{{variable_name}}` to indicate where workflow variables should be substituted.

2. **Prompt Engineering**: These templates should be refined based on testing and performance evaluation. Adjust the instructions, examples, and formatting to optimize LLM performance.

3. **System Messages**: Each prompt should be preceded by an appropriate system message that sets the context and role for the LLM.

4. **Output Parsing**: Implement structured output parsing to extract the required information from LLM responses.

5. **Few-Shot Examples**: For complex tasks, consider adding few-shot examples to the prompts to guide the LLM's responses.

6. **Prompt Versioning**: Maintain version control for prompts and track performance across versions to enable continuous improvement. 