import random
from datetime import datetime, timedelta

def generate_insert_statements(session_id, start_time, end_time):
    current_time = start_time
    insert_statements = []

    while current_time <= end_time:
        valor_hand_left = round(random.uniform(1, 6), 1)  # Valor aleatorio entre 1 y 5.9
        valor_hand_right = round(random.uniform(1, 6), 1)
        valor_head = round(random.uniform(1, 6), 1)

        insert_statements.append(f"({session_id}, 'MOV_HAND_LEFT', '{current_time}', {valor_hand_left})")
        insert_statements.append(f"({session_id}, 'MOV_HEAD', '{current_time}', {valor_head})")
        insert_statements.append(f"({session_id}, 'MOV_HAND_RIGHT', '{current_time}', {valor_hand_right})")

        current_time += timedelta(seconds=30)

    return insert_statements

def main():
    session_calls = [
        (1, '2023-10-12 10:00:00', '2023-10-12 10:20:00'),
        (2, '2023-10-12 10:10:00', '2023-10-12 10:30:00'),
        (3, '2023-10-12 10:40:00', '2023-10-12 11:10:00'),
        (4, '2023-10-20 10:20:00', '2023-10-20 11:40:00'),
        (5, '2023-10-22 10:00:00', '2023-10-22 10:20:00'),
        (6, '2023-10-22 10:44:00', '2023-10-22 11:15:00')
    ]

    with open('init.sql', 'a') as file:
        for session_id, start_time_str, end_time_str in session_calls:
            start_time = datetime.strptime(start_time_str, '%Y-%m-%d %H:%M:%S')
            end_time = datetime.strptime(end_time_str, '%Y-%m-%d %H:%M:%S')
            inserts = generate_insert_statements(session_id, start_time, end_time)
            # Escribir los inserts en el formato requerido
            if inserts:  # Comprobar si hay inserciones generadas
                file.write('INSERT INTO Stats (id_session, nombre, momento, valor) VALUES\n')
                file.write('    ' + ',\n    '.join(inserts) + ';\n\n')  # Agregar un punto y coma al final

if __name__ == "__main__":
    main()
