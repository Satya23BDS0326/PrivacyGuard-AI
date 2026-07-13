from langchain_Openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import strOutputParser
hftughdh

import streamlit as st 
import os 
from dotenv import load_dotenv

os.environ["OPENAI API KEY"]=os.getenv("OPENAI_API KEY")
os.environ["LANGCHAIN_TRACKING_V2"]=os.getenv("LANGCHAIN_TRACKING_V2")
os.environ["LANGCHAIN_API_KEY"]=os.getenv("LANGCHAIN_API_KEY")

## PROMPT TEMPLATE

prompt=ChatPromptTemplate.from_template(
  [
    ("system","You are a helpful assistant .Please responce the basic question")
    ("user","Question:{question}")
  ]
)
