package daniel.uclm.esi.gramola.dao;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import daniel.uclm.esi.gramola.models.User;

@Repository
public interface UserDao extends JpaRepository<User, String> {

}
