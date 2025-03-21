# Fractal Bot: Collaborative Problem-Solving System

we will workout the state transition details later
for now lets fix the layout
the layout should be:
- chat
- info asset palette
- workspace
- tool palette
four columns roughly the same width except the workspace is allowed to grow
info assets is that juicy collaborative clipboard that's missing from chatbots. so make that part really nice. we want to show the assets there in a nice visual way with nice icons like attachements in an email

## Overview

The Fractal Bot system enables deep collaboration between users and an AI assistant to solve complex questions through an iterative, fractal approach to workflow development and execution.

## Core Concepts

1. **Collaborative Chat Interface**
   - User and bot work together in a chat panel
   - Natural conversation to develop and refine the approach
   - Bot provides guidance while user maintains control
   - Real-time feedback and clarification

2. **Tool-Augmented Problem Solving**
   - Shared access to a suite of tools for both user and bot
   - Tool categories include:
     - Search and retrieval
     - List building and organization
     - Evaluation and analysis
     - Content generation
     - Data manipulation
   - Tools can be composed and combined as needed

3. **Fractal Workflow Development**
   - Start with high-level plan (e.g., 3-4 main steps)
   - Recursively expand steps as needed:
     ```
     1. Main step
        1a. Sub-step
        1b. Sub-step
           1b.1. Detail step
           1b.2. Detail step
        1c. Sub-step
     ```
   - Each level can utilize appropriate tools
   - Natural progression from abstract to concrete

4. **Visual Workspace**
   - Split into key areas:
     - Workflow visualization
     - Available tools palette
     - Information palette
   - Workflow area shows current plan structure
   - Tool palette provides easy access to capabilities
   - Information palette tracks all inputs/outputs

5. **Information Asset Building**
   - Each step generates valuable information
   - Information is organized and accessible
   - Assets can include:
     - Search results
     - Generated content
     - Analysis outputs
     - Intermediate findings
   - Progressive refinement of information

## Example Flow

1. **Initial Planning**
   - User presents question
   - Bot helps formulate high-level approach
   - Agreement on main workflow steps

2. **Step Refinement**
   - Focus on first major step
   - Discuss appropriate tools
   - Break into sub-steps if needed
   - Execute and gather information

3. **Progressive Development**
   - Move through steps systematically
   - Expand and refine as needed
   - Build up information assets
   - Maintain overview while diving deep

4. **Solution Synthesis**
   - Combine gathered information
   - Generate final answer
   - Review and validate

## State Transitions

| From Stage | To Stage | Purpose | Trigger | Current Message | Notes |
|------------|----------|----------|---------|-----------------|--------|
| initial | question_received | Initial greeting to receiving user's question | User sends first message | "Hello! I'm FractalBot. What question can I help you with today?" | Entry point |
| question_received | workflow_designing | Process user's question and start designing workflow | System processes the question | Shows user's question about analyzing Beatles songs | Captures initial query |
| workflow_designing | workflow_ready | Present the proposed workflow steps | System finishes designing workflow | Shows the 3-step plan for analysis | Presents action plan |
| workflow_ready | workflow_started | Begin workflow execution | User confirms to start | "Sounds good! Let's start." | Phase changes from 'setup' to 'execution' |
| workflow_started | compiling_songs | Start the first analysis step | Automatic after workflow starts | "Starting the analysis..." | Creates song list asset |
| compiling_songs | retrieving_lyrics | Move to lyrics retrieval step | After song list is compiled | "Generating the list of Beatles songs..." | Creates lyrics database asset |
| retrieving_lyrics | analyzing_lyrics | Begin analysis of lyrics | After lyrics are retrieved | "Retrieving lyrics for analysis..." | Processes gathered data |
| analyzing_lyrics | workflow_complete | Complete the workflow | After analysis is done | "Analyzing the lyrics for occurrences of 'love'..." | Final results presentation |

### Areas for Improvement

1. **Transition Timing**: Some transitions happen too quickly without showing meaningful progress
2. **Asset Management**: Assets are only created in certain transitions (compiling_songs and retrieving_lyrics) but not others
3. **Progress Feedback**: Messages could be more informative about what's happening
4. **Error Handling**: No specific error states or recovery paths
5. **User Interaction**: Limited points where user can interact or influence the workflow
6. **State Persistence**: No mechanism to save progress between stages
7. **Backward Navigation**: While supported in code, the UX for going backward isn't well defined
8. **Transition Validation**: No validation to ensure prerequisites are met before transitions

## Key Benefits

1. **Natural Problem Decomposition**
   - Break complex problems into manageable pieces
   - Maintain context at all levels
   - Flexible depth of analysis

2. **Guided Yet Flexible**
   - Structure without rigidity
   - Can adapt approach as new information emerges
   - User maintains control while leveraging bot capabilities

3. **Information Organization**
   - Clear tracking of progress
   - Easy access to all generated assets
   - Building blocks for solution

4. **Tool Integration**
   - Right tool for each sub-task
   - Combine tools effectively
   - Build on previous results
