import networkx as nx
from matplotlib.pyplot import *


def degreeBars(graph, sort=True):
    """Draws a bar chart showing its degree distribution.
    @params graph: A NetworkX graph
    @params sort: Defines if the bars will be sorted"""
    degrees = nx.degree(graph)
    if sort:
        bar(range(len(degrees)),sorted(degrees.values()))
    else:
        bar(range(len(degrees)),degrees.values())

