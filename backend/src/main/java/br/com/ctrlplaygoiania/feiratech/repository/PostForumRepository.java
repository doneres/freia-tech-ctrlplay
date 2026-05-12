package br.com.ctrlplaygoiania.feiratech.repository;

import br.com.ctrlplaygoiania.feiratech.model.PostForum;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface PostForumRepository extends JpaRepository<PostForum, UUID> {
    List<PostForum> findAllByOrderByFixadoDescCreatedAtDesc();
}
