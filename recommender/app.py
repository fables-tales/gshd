import psycopg2
import os
from recsys.datamodel.data import Data
from recsys.algorithm.factorize import SVD
from collections import defaultdict


def database_connection():
    try:
        username = os.environ["DATABASE_URL"].split(":")[1].replace("//","")
        password = os.environ["DATABASE_URL"].split(":")[2].split("@")[0]
        host = os.environ["DATABASE_URL"].split(":")[2].split("@")[1].split("/")[0]
        dbname = os.environ["DATABASE_URL"].split(":")[2].split("@")[1].split("/")[1]
        return psycopg2.connect(dbname=dbname, user=username, password=password, host=host)
    except KeyError:
        return psycopg2.connect(dbname="gshd_development")

def label_scores_on_spaces():
    conn = database_connection()
    cur = conn.cursor()
    cur.execute("select user_id, name, value from terms")

    dictionary = {}

    user_label_score = []
    user_term_scores = defaultdict(lambda: defaultdict(float))

    for user, labels, value in cur:
        labels = labels.split(" ")
        munged_labels = []
        for label in labels:
            if label not in dictionary:
                dictionary[label] = len(dictionary)
            munged_labels.append(dictionary[label])

        for label in munged_labels:
            user_term_scores[user][label] += value
    for user_id,terms in user_term_scores.iteritems():
        for label, score in terms.iteritems():
            user_label_score.append((score, user_id, label))

    return user_label_score

def build_data_model(label_scores):
    data = Data()
    for row in label_scores:
        data.add_tuple(row)

    return data

def train_svd(data_model):
    svd = SVD()
    svd.set_data(data_model)
    svd.compute(k=100, min_values=3, mean_center=True)
    return svd

if __name__ == "__main__":
    ls = label_scores_on_spaces()
    dm = build_data_model(ls)
    svd = train_svd(dm)

    conn = database_connection()
    cur = conn.cursor()
    cur.execute("select id from users")
    for user_id in cur:
        user_id = user_id[0]
        recommendations = svd.similar(int(user_id))
        for id,score in recommendations:
            if id != user_id:
                print user_id, id, score
