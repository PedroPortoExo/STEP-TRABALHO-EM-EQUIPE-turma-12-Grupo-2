import { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../components/AuthContext';
import styles from './listLivros.module.css';

function ListLivros() {
    const [livros, setLivros] = useState([]);
    const { user, updateUser } = useContext(AuthContext);

    useEffect(() => {
        fetch('http://localhost:5000/books')
            .then(response => response.json())
            .then(data => setLivros(data));
    }, []);

    const livrosEmprestados = user 
        ? livros.filter(livro =>
            user.borrowedBooks.some(borrowed => borrowed.bookId === livro.id)
          )
        : [];

    const handleReturn = async (bookId) => {
        if (!user) return;

        // Atualiza o usuário removendo o livro devolvido
        const updatedBorrowedBooks = user.borrowedBooks.filter(borrowed => borrowed.bookId !== bookId);
        const updatedUser = { ...user, borrowedBooks: updatedBorrowedBooks };

        // Atualiza o AuthContext
        updateUser(updatedUser);

        // Atualiza o número de cópias do livro no backend
        const bookToUpdate = livros.find(livro => livro.id === bookId);
        if (bookToUpdate) {
            const updatedBook = { ...bookToUpdate, copiesAvailable: bookToUpdate.copiesAvailable + 1 };
            await fetch(`http://localhost:5000/books/${bookId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updatedBook),
            });
        }

        // Atualiza o estado local dos livros
        setLivros((prevLivros) =>
            prevLivros.map((livro) =>
                livro.id === bookId ? { ...livro, copiesAvailable: livro.copiesAvailable + 1 } : livro
            )
        );
    };

    return (
        <main className={styles.mainContent}>
            <p className={styles.userWelcome}>
                {user ? `Bem-vindo(a), ${user.name}. Você tem ${livrosEmprestados.length} livro${livrosEmprestados.length !== 1 ? 's' : ''} emprestado${livrosEmprestados.length !== 1 ? 's' : ''}.` : 'Carregando...'}
            </p>
            <section className={styles.section_cards}>
                <div className={styles.cardContainer}>
                    {livrosEmprestados.map(livro => (
                        <a href={""} key={livro.id} className={styles.cardLink}>
                            <div className={styles.cardCustom}>
                                <img
                                    src={`${process.env.PUBLIC_URL}/images/${livro.coverImage}`}
                                    alt={livro.title}
                                    className={styles.cardImage}
                                />
                                <div className="card-body">
                                    <div className={styles.tituloLivro}>
                                        <h3>{livro.title}</h3>
                                    </div>
                                    <div className={styles.autor}>
                                        <h4>{livro.author}</h4>
                                    </div>
                                    <div className={styles.tempAluguel}>
                                    <p>Tempo de aluguel: <br></br> {user.borrowedBooks.find(borrowed => borrowed.bookId === livro.id)?.dueDate || 'N/A'}</p>
                                    </div>
                                </div>
                                <button id="customButton" className={styles.customButton}>Ler</button>
                                <button id="customButtonReturn" onClick={() => handleReturn(livro.id)} className={styles.customButtonReturn}>Devolver</button>
                            </div>
                        </a>
                    ))}
                </div>
            </section>
        </main>
    );
}

export default ListLivros;